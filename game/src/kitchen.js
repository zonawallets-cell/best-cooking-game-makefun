// The kitchen itself: the chef, the stations, and what happens when the
// chef works one. Movement, chopping, grilling, plating, serving and
// trashing all live here; drawing lives in render.js and the loop in
// main.js. Every side effect the player should hear about is pushed onto
// `game.events` as a plain { type } object, which main.js drains into
// sounds, so this file never touches audio or the DOM.
import {
  BURN_AFTER_SECONDS,
  CHOP_SECONDS,
  GRILL_SECONDS,
  HAND_SLOTS,
  HUD_HEIGHT,
  INTERACT_REACH,
  MAX_HEARTS,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  PLAYER_START,
  SHIFT_SECONDS,
  STATION_LIST,
  VIEW,
} from './config.js';
import { createOrderQueue, findMatchingOrder, spawnOrder, tickOrders } from './orders.js';
import { createRandom } from './random.js';
import { INGREDIENTS, freshIngredient } from './recipes.js';

/** A brand-new shift: full timer, full hearts, one ticket already waiting. */
export function createGameState(seed) {
  const random = createRandom(seed);
  const game = {
    screen: 'title',
    seed,
    random,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    servedCount: 0,
    expiredCount: 0,
    hearts: MAX_HEARTS,
    queue: createOrderQueue(),
    player: {
      x: PLAYER_START.x,
      y: PLAYER_START.y,
      facing: 1,
      moving: false,
      carrying: [],
    },
    board: { item: null, progress: 0 },
    grill: { item: null, progress: 0 },
    plate: null,
    floats: [],
    banner: null,
    message: null,
    events: [],
    overReason: '',
  };
  spawnOrder(game.queue, random);
  return game;
}

/** A floating "+90" style note that rises and fades where it was earned. */
export function addFloat(game, x, y, text, color) {
  game.floats.push({ x, y, text, color, life: 1.4 });
}

/** A short hint line at the bottom of the screen. */
export function showMessage(game, text) {
  game.message = { text, life: 2.2 };
}

/** A big centre-screen banner, for serves and warnings. */
export function showBanner(game, text, sub, color) {
  game.banner = { text, sub, color, life: 1.8 };
}

/** Whether the chef's hands have a free slot. */
export function handsFree(game) {
  return game.player.carrying.length < HAND_SLOTS;
}

/** Whether the chef is carrying a finished plate. */
export function carryingPlate(game) {
  return game.player.carrying.some((item) => item.kind === 'plate');
}

/** The plate the chef carries, or null. */
export function carriedPlate(game) {
  return game.player.carrying.find((item) => item.kind === 'plate') ?? null;
}

// ---------------------------------------------------------------- movement

function collidesWithStations(x, y) {
  for (const station of STATION_LIST) {
    const closestX = Math.max(station.x, Math.min(x, station.x + station.w));
    const closestY = Math.max(station.y, Math.min(y, station.y + station.h));
    const dx = x - closestX;
    const dy = y - closestY;
    if (dx * dx + dy * dy < PLAYER_RADIUS * PLAYER_RADIUS) return true;
  }
  return false;
}

/**
 * Walk the chef by (`dx`, `dy`) for `dt` seconds, sliding along counters
 * instead of sticking on them: try the full step, then each axis alone.
 */
export function movePlayer(game, dx, dy, dt) {
  const player = game.player;
  if (dx === 0 && dy === 0) {
    player.moving = false;
    return;
  }
  const length = Math.hypot(dx, dy);
  const stepX = (dx / length) * PLAYER_SPEED * dt;
  const stepY = (dy / length) * PLAYER_SPEED * dt;
  const tryMove = (nx, ny) => {
    const clampedX = Math.max(PLAYER_RADIUS + 8, Math.min(VIEW.width - PLAYER_RADIUS - 8, nx));
    const clampedY = Math.max(HUD_HEIGHT + PLAYER_RADIUS + 8, Math.min(VIEW.height - PLAYER_RADIUS - 8, ny));
    if (!collidesWithStations(clampedX, clampedY)) {
      player.x = clampedX;
      player.y = clampedY;
      return true;
    }
    return false;
  };
  const moved = tryMove(player.x + stepX, player.y + stepY)
    || tryMove(player.x + stepX, player.y)
    || tryMove(player.x, player.y + stepY);
  player.moving = moved;
  if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
}

/** The station the chef stands close enough to work, or null. */
export function nearestStation(game) {
  const player = game.player;
  let best = null;
  let bestDistance = Infinity;
  for (const station of STATION_LIST) {
    const closestX = Math.max(station.x, Math.min(player.x, station.x + station.w));
    const closestY = Math.max(station.y, Math.min(player.y, station.y + station.h));
    const distance = Math.hypot(player.x - closestX, player.y - closestY);
    if (distance < INTERACT_REACH && distance < bestDistance) {
      best = station;
      bestDistance = distance;
    }
  }
  return best;
}

/** The station under a mouse click, when the chef can reach it. */
export function stationAtPoint(game, x, y) {
  for (const station of STATION_LIST) {
    if (x >= station.x && x <= station.x + station.w && y >= station.y && y <= station.y + station.h) {
      const closestX = Math.max(station.x, Math.min(game.player.x, station.x + station.w));
      const closestY = Math.max(station.y, Math.min(game.player.y, station.y + station.h));
      if (Math.hypot(game.player.x - closestX, game.player.y - closestY) < INTERACT_REACH + 30) return station;
    }
  }
  return null;
}

// ---------------------------------------------------------------- stations

/** Take the top carried item off the chef's hands, or null when empty. */
function takeTopItem(game) {
  return game.player.carrying.pop() ?? null;
}

/** What the E key (or a click) does at each station. */
export function interact(game, station) {
  if (!station) return;
  const player = game.player;
  if (station.kind === 'pantry') {
    if (carryingPlate(game)) {
      showMessage(game, 'Hands full — serve that plate first!');
      game.events.push({ type: 'error' });
      return;
    }
    if (!handsFree(game)) {
      showMessage(game, 'Hands full! Plate or trash something first.');
      game.events.push({ type: 'error' });
      return;
    }
    player.carrying.push(freshIngredient(station.item));
    game.events.push({ type: 'pickup' });
    return;
  }
  if (station.kind === 'board') {
    if (game.board.item === null) {
      const top = player.carrying[player.carrying.length - 1];
      if (top && top.kind !== 'plate' && top.prep === 'raw' && INGREDIENTS[top.kind].needs === 'chop') {
        player.carrying.pop();
        game.board.item = top;
        game.board.progress = 0;
        game.events.push({ type: 'place' });
      } else {
        showMessage(game, 'The board is for chopping: bring a raw tomato, lettuce or onion.');
        game.events.push({ type: 'error' });
      }
      return;
    }
    if (game.board.item.prep === 'chopped') {
      if (carryingPlate(game) || !handsFree(game)) {
        showMessage(game, 'No free hand for the chopped veg.');
        game.events.push({ type: 'error' });
        return;
      }
      player.carrying.push(game.board.item);
      game.board.item = null;
      game.board.progress = 0;
      game.events.push({ type: 'pickup' });
      return;
    }
    showMessage(game, 'Still chopping…');
    return;
  }
  if (station.kind === 'grill') {
    if (game.grill.item === null) {
      const top = player.carrying[player.carrying.length - 1];
      if (top && top.kind === 'patty' && top.prep === 'raw') {
        player.carrying.pop();
        game.grill.item = top;
        game.grill.progress = 0;
        game.events.push({ type: 'sizzle' });
      } else {
        showMessage(game, 'The grill is for patties: bring a raw patty.');
        game.events.push({ type: 'error' });
      }
      return;
    }
    if (game.grill.item.prep === 'cooked' || game.grill.item.prep === 'burnt') {
      if (carryingPlate(game) || !handsFree(game)) {
        showMessage(game, 'No free hand for the patty.');
        game.events.push({ type: 'error' });
        return;
      }
      player.carrying.push(game.grill.item);
      game.grill.item = null;
      game.grill.progress = 0;
      game.events.push({ type: 'pickup' });
      return;
    }
    showMessage(game, 'Still grilling…');
    return;
  }
  if (station.kind === 'plating') {
    const plate = carriedPlate(game);
    if (plate) {
      if (game.plate !== null) {
        showMessage(game, 'A plate is already on the counter.');
        game.events.push({ type: 'error' });
        return;
      }
      player.carrying = player.carrying.filter((item) => item.kind !== 'plate');
      game.plate = plate;
      game.events.push({ type: 'place' });
      return;
    }
    if (game.plate === null) {
      const ingredients = player.carrying.filter((item) => item.kind !== 'plate');
      if (ingredients.length === 0) {
        showMessage(game, 'Bring ingredients here to start a plate.');
        game.events.push({ type: 'error' });
        return;
      }
      game.plate = { kind: 'plate', items: [...ingredients] };
      player.carrying = [];
      game.events.push({ type: 'place' });
      return;
    }
    const ingredients = player.carrying.filter((item) => item.kind !== 'plate');
    if (ingredients.length === 0) {
      player.carrying.push(game.plate);
      game.plate = null;
      game.events.push({ type: 'pickup' });
      return;
    }
    game.plate.items.push(...ingredients);
    player.carrying = [];
    game.events.push({ type: 'place' });
    return;
  }
  if (station.kind === 'window') {
    const plate = carriedPlate(game);
    if (!plate) {
      showMessage(game, 'Bring a finished plate to the window to serve it.');
      game.events.push({ type: 'error' });
      return;
    }
    const order = findMatchingOrder(game.queue.orders, plate.items);
    if (!order) {
      showMessage(game, 'No ticket wants this plate — check the order board!');
      game.events.push({ type: 'error' });
      return;
    }
    serveOrder(game, order, plate);
    return;
  }
  if (station.kind === 'trash') {
    if (player.carrying.length === 0) {
      showMessage(game, 'Nothing to throw away.');
      return;
    }
    const dropped = takeTopItem(game);
    game.events.push({ type: 'trash' });
    showMessage(game, dropped.kind === 'plate' ? 'Plate trashed — start that dish again.' : `Trashed the ${INGREDIENTS[dropped.kind].name.toLowerCase()}.`);
  }
}

/** Score a served ticket: base + a patience tip, grown by the serve streak. */
function serveOrder(game, order, plate) {
  game.queue.orders = game.queue.orders.filter((entry) => entry.id !== order.id);
  game.player.carrying = game.player.carrying.filter((item) => item.kind !== 'plate');
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  game.servedCount += 1;
  const patienceShare = Math.max(0, order.patience / order.maxPatience);
  const tip = Math.round(20 * patienceShare);
  const multiplier = Math.min(1.5, 1 + 0.1 * (game.combo - 1));
  const points = Math.round((order.recipe.base + tip) * multiplier);
  game.score += points;
  addFloat(game, 1000, 580, `+${points}`, '#ffd94d');
  showBanner(game, 'SERVED!', `${order.recipe.name}  •  +${points} pts${game.combo > 1 ? `  •  x${multiplier.toFixed(1)} combo` : ''}`, '#7ddc8a');
  game.events.push({ type: 'serve' });
}

/** One expired ticket costs a heart and breaks the serve streak. */
function loseOrder(game, order) {
  game.expiredCount += 1;
  game.combo = 0;
  game.hearts -= 1;
  showBanner(game, 'ORDER LOST', `${order.recipe.name} walked out hungry…`, '#ff7a6b');
  game.events.push({ type: 'lost' });
  if (game.hearts <= 0) endShift(game, 'The kitchen lost its third ticket — the rush won this time.');
}

/** The shift ends: the timer ran out, or the hearts did. */
export function endShift(game, reason) {
  game.screen = 'over';
  game.overReason = reason;
  game.events.push({ type: 'over' });
}

// ---------------------------------------------------------------- the tick

/** Advance the live game by `dt` seconds: timer, orders, stations, floats. */
export function updateGame(game, dt) {
  if (game.screen !== 'play') return;
  game.elapsed += dt;
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    endShift(game, 'Shift over! The dinner rush is done.');
    return;
  }
  const elapsedFraction = game.elapsed / SHIFT_SECONDS;
  const expired = tickOrders(game.queue, dt, game.random, elapsedFraction);
  for (const order of expired) loseOrder(game, order);
  if (game.screen !== 'play') return;

  if (game.board.item && game.board.item.prep === 'raw') {
    game.board.progress += dt / CHOP_SECONDS;
    if (game.board.progress >= 1) {
      game.board.item.prep = 'chopped';
      game.board.progress = 1;
      game.events.push({ type: 'chopped' });
    }
  }
  if (game.grill.item) {
    game.grill.progress += dt;
    if (game.grill.item.prep === 'raw' && game.grill.progress >= GRILL_SECONDS) {
      game.grill.item.prep = 'cooked';
      game.events.push({ type: 'ding' });
    } else if (game.grill.item.prep === 'cooked' && game.grill.progress >= BURN_AFTER_SECONDS) {
      game.grill.item.prep = 'burnt';
      game.events.push({ type: 'burnt' });
      showMessage(game, 'A patty burned on the grill!');
    }
  }
  for (const float of game.floats) {
    float.life -= dt;
    float.y -= 34 * dt;
  }
  game.floats = game.floats.filter((float) => float.life > 0);
  if (game.banner) {
    game.banner.life -= dt;
    if (game.banner.life <= 0) game.banner = null;
  }
  if (game.message) {
    game.message.life -= dt;
    if (game.message.life <= 0) game.message = null;
  }
}

/** Start a fresh shift from the title screen. */
export function startShift(game) {
  const fresh = createGameState(game.seed);
  Object.assign(game, fresh, { screen: 'play' });
}
