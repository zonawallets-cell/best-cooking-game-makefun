// Everything the player sees, drawn on one canvas with plain shapes — no
// image files, so the game loads nothing over the network. The kitchen is
// drawn top-down: the order board and timer across the top, pantry bins
// down the left wall, grill top-right, chopping board, plating counter and
// serving window along the bottom. Every frame is drawn from the game
// state, so a screenshot is exactly what a player sees.
import {
  CHOP_SECONDS,
  GRILL_SECONDS,
  HUD_HEIGHT,
  MAX_HEARTS,
  PLAYER_RADIUS,
  SHIFT_SECONDS,
  STATIONS,
  VIEW,
} from './config.js';
import { INGREDIENTS, RECIPES, recipeNeedsText } from './recipes.js';
import { nearestStation } from './kitchen.js';

const FLOOR_A = '#c98f5f';
const FLOOR_B = '#bd8254';
const COUNTER_TOP = '#8a5a33';
const COUNTER_SIDE = '#6e4525';
const STEEL = '#9aa5ad';
const INK = '#2b2118';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight ?? 700} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function label(ctx, value, x, y, size, color) {
  text(ctx, value, x, y, size, color, 800, 'center');
}

// ---------------------------------------------------------------- ingredients

/** One ingredient icon, drawn as flat shapes at (`x`, `y`) with size `s`. */
export function drawIngredient(ctx, item, x, y, s) {
  const def = INGREDIENTS[item.kind];
  ctx.save();
  ctx.translate(x, y);
  if (item.prep === 'chopped') {
    drawDiced(ctx, def.color, def.dark, s);
  } else if (item.kind === 'tomato') {
    drawTomato(ctx, def, s);
  } else if (item.kind === 'lettuce') {
    drawLettuce(ctx, def, s);
  } else if (item.kind === 'onion') {
    drawOnion(ctx, def, s);
  } else if (item.kind === 'cheese') {
    drawCheese(ctx, def, s);
  } else if (item.kind === 'patty') {
    drawPatty(ctx, def, s, item.prep);
  } else if (item.kind === 'bread') {
    drawBread(ctx, def, s);
  }
  ctx.restore();
}

function drawTomato(ctx, def, s) {
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3f9e4d';
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.42);
  ctx.lineTo(-s * 0.2, -s * 0.62);
  ctx.lineTo(0, -s * 0.48);
  ctx.lineTo(s * 0.2, -s * 0.62);
  ctx.lineTo(0, -s * 0.42);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(-s * 0.15, -s * 0.15, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawLettuce(ctx, def, s) {
  ctx.fillStyle = def.dark;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = def.color;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * s * 0.2, Math.sin(angle) * s * 0.2, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#8fd19a';
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

function drawOnion(ctx, def, s) {
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#efe2f5';
  ctx.lineWidth = s * 0.06;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#3f9e4d';
  ctx.fillRect(-s * 0.04, -s * 0.58, s * 0.08, s * 0.2);
}

function drawCheese(ctx, def, s) {
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.moveTo(-s * 0.42, s * 0.3);
  ctx.lineTo(s * 0.42, s * 0.3);
  ctx.lineTo(0, -s * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = def.dark;
  ctx.beginPath();
  ctx.arc(-s * 0.12, s * 0.08, s * 0.07, 0, Math.PI * 2);
  ctx.arc(s * 0.14, s * 0.14, s * 0.05, 0, Math.PI * 2);
  ctx.fill();
}

function drawPatty(ctx, def, s, prep) {
  const cooked = prep === 'cooked';
  const burnt = prep === 'burnt';
  ctx.fillStyle = burnt ? '#221a14' : cooked ? '#6b3f1d' : def.color;
  roundRect(ctx, -s * 0.46, -s * 0.3, s * 0.92, s * 0.6, s * 0.2);
  ctx.fill();
  if (!burnt) {
    ctx.strokeStyle = cooked ? '#4a2a12' : def.dark;
    ctx.lineWidth = s * 0.05;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.26 - s * 0.08, -s * 0.22);
      ctx.lineTo(i * s * 0.26 + s * 0.08, s * 0.22);
      ctx.stroke();
    }
  }
}

function drawBread(ctx, def, s) {
  ctx.fillStyle = def.dark;
  roundRect(ctx, -s * 0.44, -s * 0.4, s * 0.88, s * 0.8, s * 0.14);
  ctx.fill();
  ctx.fillStyle = def.color;
  roundRect(ctx, -s * 0.36, -s * 0.32, s * 0.72, s * 0.64, s * 0.1);
  ctx.fill();
}

/** Chopped veg: three little dice, scattered so the cut reads at a glance. */
function drawDiced(ctx, color, dark, s) {
  ctx.fillStyle = color;
  const spots = [[-0.2, -0.12], [0.18, -0.16], [0.02, 0.18], [-0.24, 0.2], [0.24, 0.14]];
  for (const [dx, dy] of spots) {
    ctx.fillRect(dx * s - s * 0.09, dy * s - s * 0.09, s * 0.18, s * 0.18);
  }
  ctx.fillStyle = dark;
  ctx.fillRect(-s * 0.05, -s * 0.05, s * 0.1, s * 0.1);
}

/** A white plate with the dish's finished items lined up on it. */
export function drawPlate(ctx, items, x, y, s) {
  ctx.fillStyle = '#f4f1ea';
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.62, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9c2b2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.5, s * 0.32, 0, 0, Math.PI * 2);
  ctx.stroke();
  const n = items.length;
  items.forEach((item, i) => {
    const offset = n === 1 ? 0 : (i - (n - 1) / 2) * s * 0.34;
    drawIngredient(ctx, item, x + offset, y - s * 0.06, s * 0.42);
  });
}

// ---------------------------------------------------------------- the kitchen

function drawFloor(ctx) {
  ctx.fillStyle = FLOOR_A;
  ctx.fillRect(0, HUD_HEIGHT, VIEW.width, VIEW.height - HUD_HEIGHT);
  ctx.fillStyle = FLOOR_B;
  const tile = 80;
  for (let y = HUD_HEIGHT; y < VIEW.height; y += tile) {
    for (let x = ((y / tile) % 2 === 0 ? 0 : tile / 2); x < VIEW.width; x += tile) {
      ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
    }
  }
  ctx.fillStyle = '#a4713f';
  ctx.fillRect(0, HUD_HEIGHT, VIEW.width, 10);
}

function drawCounter(ctx, station, topColor, sideColor) {
  ctx.fillStyle = sideColor;
  roundRect(ctx, station.x, station.y + 8, station.w, station.h, 10);
  ctx.fill();
  ctx.fillStyle = topColor;
  roundRect(ctx, station.x, station.y, station.w, station.h - 8, 10);
  ctx.fill();
}

function drawPantryBin(ctx, station, now) {
  drawCounter(ctx, station, '#7c4a21', '#5d3617');
  const item = { kind: station.item, prep: 'raw' };
  drawIngredient(ctx, item, station.x + 34, station.y + station.h / 2, 52);
  label(ctx, INGREDIENTS[station.item].name.toUpperCase(), station.x + station.w / 2 + 18, station.y + 26, 15, '#ffe9c4');
  const need = INGREDIENTS[station.item].needs;
  const hint = need === 'chop' ? 'chop it' : need === 'grill' ? 'grill it' : 'ready to serve';
  text(ctx, hint, station.x + station.w / 2 + 18, station.y + station.h - 24, 13, '#d9b98a', 600, 'center');
  void now;
}

function drawBoard(ctx, game, now) {
  const station = STATIONS.board;
  drawCounter(ctx, station, '#e8c890', '#b98a3e');
  label(ctx, 'CHOPPING BOARD', station.x + station.w / 2, station.y - 16, 15, '#ffe9c4');
  if (game.board.item) {
    drawIngredient(ctx, game.board.item, station.x + station.w / 2, station.y + station.h / 2, 64);
    if (game.board.item.prep === 'raw') {
      drawProgressBar(ctx, station.x + 24, station.y + station.h - 22, station.w - 48, 12, game.board.progress, '#58b368');
    }
  } else {
    ctx.strokeStyle = 'rgba(43,33,24,0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(station.x + station.w / 2, station.y + station.h / 2, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  void now;
}

function drawGrill(ctx, game, now) {
  const station = STATIONS.grill;
  drawCounter(ctx, station, STEEL, '#6d767e');
  label(ctx, 'GRILL', station.x + station.w / 2, station.y - 16, 15, '#ffe9c4');
  ctx.fillStyle = '#3a3f45';
  roundRect(ctx, station.x + 16, station.y + 18, station.w - 32, station.h - 40, 8);
  ctx.fill();
  ctx.strokeStyle = '#22262a';
  ctx.lineWidth = 3;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(station.x + 16 + ((station.w - 32) / 5) * i, station.y + 22);
    ctx.lineTo(station.x + 16 + ((station.w - 32) / 5) * i, station.y + station.h - 26);
    ctx.stroke();
  }
  if (game.grill.item) {
    const cx = station.x + station.w / 2;
    const cy = station.y + station.h / 2;
    const flame = game.grill.item.prep === 'raw' ? 0.5 + 0.5 * Math.sin(now / 130) : 0;
    if (flame > 0) {
      ctx.fillStyle = `rgba(255,${Math.floor(140 + 60 * flame)},40,${0.35 + 0.3 * flame})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, 46, 12 + 6 * flame, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawIngredient(ctx, game.grill.item, cx, cy, 62);
    if (game.grill.item.prep === 'raw') {
      drawProgressBar(ctx, station.x + 24, station.y + station.h - 22, station.w - 48, 12, game.grill.progress / GRILL_SECONDS, '#ff9a3d');
    } else if (game.grill.item.prep === 'cooked') {
      const pulse = 0.6 + 0.4 * Math.sin(now / 180);
      text(ctx, 'READY!', cx, station.y + station.h - 16, 15, `rgba(125,220,138,${pulse})`, 800, 'center');
    } else {
      text(ctx, 'BURNT!', cx, station.y + station.h - 16, 15, '#ff7a6b', 800, 'center');
    }
  }
}

function drawPlating(ctx, game) {
  const station = STATIONS.plating;
  drawCounter(ctx, station, '#e8c890', '#b98a3e');
  label(ctx, 'PLATING', station.x + station.w / 2, station.y - 16, 15, '#ffe9c4');
  if (game.plate) {
    drawPlate(ctx, game.plate.items, station.x + station.w / 2, station.y + station.h / 2 + 4, 92);
  } else {
    ctx.strokeStyle = 'rgba(43,33,24,0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.ellipse(station.x + station.w / 2, station.y + station.h / 2, 52, 30, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'drop food here', station.x + station.w / 2, station.y + station.h - 18, 13, '#7a5a34', 600, 'center');
  }
}

function drawWindow(ctx, game, now) {
  const station = STATIONS.window;
  drawCounter(ctx, station, '#7fb069', '#4e7a3e');
  label(ctx, 'SERVE HERE', station.x + station.w / 2, station.y - 16, 15, '#eaffea');
  ctx.fillStyle = '#f4f1ea';
  roundRect(ctx, station.x + 18, station.y + 16, station.w - 36, station.h - 34, 8);
  ctx.fill();
  const bell = 0.7 + 0.3 * Math.sin(now / 300);
  ctx.fillStyle = `rgba(246,201,69,${bell})`;
  ctx.beginPath();
  ctx.arc(station.x + station.w / 2, station.y + station.h / 2 - 6, 20, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(station.x + station.w / 2 - 22, station.y + station.h / 2 - 8, 44, 6);
  text(ctx, 'RING THE BELL', station.x + station.w / 2, station.y + station.h - 16, 13, '#2f5230', 800, 'center');
  void game;
}

function drawTrash(ctx) {
  const station = STATIONS.trash;
  ctx.fillStyle = '#5a636b';
  roundRect(ctx, station.x, station.y, station.w, station.h, 10);
  ctx.fill();
  ctx.fillStyle = '#78828b';
  roundRect(ctx, station.x + 8, station.y + 8, station.w - 16, 18, 6);
  ctx.fill();
  label(ctx, 'TRASH', station.x + station.w / 2, station.y + station.h / 2 + 16, 15, '#e8ecef');
}

function drawProgressBar(ctx, x, y, w, h, fraction, color) {
  const clamped = Math.max(0, Math.min(1, fraction));
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x + 2, y + 2, Math.max(h - 4, (w - 4) * clamped), h - 4, (h - 4) / 2);
  ctx.fill();
}

// ---------------------------------------------------------------- the chef

function drawPlayer(ctx, game, now) {
  const player = game.player;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + PLAYER_RADIUS - 4, PLAYER_RADIUS, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  const bob = player.moving ? Math.sin(now / 90) * 2 : 0;
  const x = player.x;
  const y = player.y + bob;
  ctx.fillStyle = '#f4f1ea';
  ctx.beginPath();
  ctx.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d94f3d';
  ctx.fillRect(x - PLAYER_RADIUS, y - 4, PLAYER_RADIUS * 2, 12);
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(x, y - PLAYER_RADIUS - 6, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 9, y - PLAYER_RADIUS - 20, 9, 0, Math.PI * 2);
  ctx.arc(x + 9, y - PLAYER_RADIUS - 20, 9, 0, Math.PI * 2);
  ctx.arc(x, y - PLAYER_RADIUS - 24, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 15, y - PLAYER_RADIUS - 16, 30, 8);
  ctx.fillStyle = INK;
  const eyeX = player.facing * 4;
  ctx.beginPath();
  ctx.arc(x - 6 + eyeX, y - PLAYER_RADIUS - 6, 2.2, 0, Math.PI * 2);
  ctx.arc(x + 6 + eyeX, y - PLAYER_RADIUS - 6, 2.2, 0, Math.PI * 2);
  ctx.fill();
  drawCarried(ctx, game, x, y - PLAYER_RADIUS - 34);
}

/** What the chef carries, drawn in a row above the toque. */
function drawCarried(ctx, game, x, y) {
  const carrying = game.player.carrying;
  if (carrying.length === 0) return;
  const plate = carrying.find((item) => item.kind === 'plate');
  if (plate) {
    drawPlate(ctx, plate.items, x, y - 6, 74);
    return;
  }
  const n = carrying.length;
  carrying.forEach((item, i) => {
    const offset = (i - (n - 1) / 2) * 34;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(x + offset, y + 16, 17, 0, Math.PI * 2);
    ctx.fill();
    drawIngredient(ctx, item, x + offset, y, 30);
  });
}

// ---------------------------------------------------------------- HUD: board, timer, score

function drawOrderTicket(ctx, order, x, y, w, h, now) {
  const urgent = order.patience < 12;
  const flash = urgent && Math.sin(now / 150) > 0;
  ctx.fillStyle = flash ? '#ffe1dc' : '#fff8e8';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = order.recipe.color;
  roundRect(ctx, x, y, w, 8, 4);
  ctx.fill();
  text(ctx, order.recipe.name, x + 10, y + 24, 16, INK, 800);
  const needs = order.recipe.needs;
  needs.forEach((need, i) => {
    drawIngredient(ctx, { kind: need.kind, prep: need.prep }, x + 20 + i * 34, y + 52, 28);
  });
  const fraction = Math.max(0, order.patience / order.maxPatience);
  const barColor = fraction > 0.5 ? '#58b368' : fraction > 0.25 ? '#f6c945' : '#e2452f';
  drawProgressBar(ctx, x + 10, y + h - 12, w - 20, 8, fraction, barColor);
}

function drawOrderBoard(ctx, game, now) {
  ctx.fillStyle = '#3d2b1a';
  ctx.fillRect(0, 0, VIEW.width, HUD_HEIGHT);
  ctx.fillStyle = '#2b1d10';
  ctx.fillRect(0, HUD_HEIGHT - 6, VIEW.width, 6);
  text(ctx, 'ORDERS', 20, 14, 13, '#d9b98a', 800);
  game.queue.orders.forEach((order, i) => {
    drawOrderTicket(ctx, order, 16 + i * 204, 26, 196, 72, now);
  });
  if (game.queue.orders.length === 0) {
    text(ctx, 'No orders — breathe!', 24, 62, 15, '#d9b98a', 600);
  }
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function drawTimerAndScore(ctx, game, now) {
  const lowTime = game.timeLeft < 30;
  const pulse = lowTime ? 0.65 + 0.35 * Math.sin(now / 160) : 1;
  text(ctx, 'SHIFT', 960, 18, 13, '#d9b98a', 800, 'center');
  text(ctx, formatTime(game.timeLeft), 960, 52, 34, lowTime ? `rgba(255,122,107,${pulse})` : '#fff8e8', 800, 'center');
  drawProgressBar(ctx, 872, 76, 176, 10, game.timeLeft / SHIFT_SECONDS, lowTime ? '#e2452f' : '#58b368');
  text(ctx, 'SCORE', 1170, 18, 13, '#d9b98a', 800, 'center');
  text(ctx, String(game.score), 1170, 52, 34, '#ffd94d', 800, 'center');
  for (let i = 0; i < MAX_HEARTS; i++) {
    const hx = 1112 + i * 30;
    const hy = 82;
    ctx.fillStyle = i < game.hearts ? '#ff6b7a' : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(hx, hy - 3, 7, 0, Math.PI * 2);
    ctx.arc(hx + 11, hy - 3, 7, 0, Math.PI * 2);
    ctx.moveTo(hx - 2, hy + 8);
    ctx.lineTo(hx + 13, hy + 8);
    ctx.lineTo(hx + 5.5, hy - 1);
    ctx.closePath();
    ctx.fill();
  }
  if (game.combo > 1) {
    text(ctx, `COMBO x${Math.min(1.5, 1 + 0.1 * (game.combo - 1)).toFixed(1)} (${game.combo} serves)`, 1170, 99, 12, '#7ddc8a', 700, 'center');
  }
}

function drawFloats(ctx, game) {
  for (const float of game.floats) {
    ctx.globalAlpha = Math.max(0, Math.min(1, float.life));
    text(ctx, float.text, float.x, float.y, 30, float.color, 800, 'center');
  }
  ctx.globalAlpha = 1;
}

function drawBanner(ctx, game) {
  if (!game.banner) return;
  const alpha = Math.max(0, Math.min(1, game.banner.life));
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, VIEW.width / 2 - 260, 300, 520, 96, 16);
  ctx.fill();
  text(ctx, game.banner.text, VIEW.width / 2, 332, 40, game.banner.color, 800, 'center');
  text(ctx, game.banner.sub, VIEW.width / 2, 370, 18, '#fff8e8', 600, 'center');
  ctx.globalAlpha = 1;
}

function drawMessage(ctx, game) {
  if (!game.message) return;
  ctx.globalAlpha = Math.max(0, Math.min(1, game.message.life));
  text(ctx, game.message.text, VIEW.width / 2, VIEW.height - 26, 17, '#fff8e8', 700, 'center');
  ctx.globalAlpha = 1;
}

function drawHint(ctx, game, input) {
  const station = nearestStation(game);
  let hint = 'WASD / arrows — move    •    E — use station    •    M — mute';
  if (station) {
    if (station.kind === 'pantry') hint = `E — take a ${INGREDIENTS[station.item].name}`;
    else if (station.kind === 'board') hint = game.board.item ? 'Chopping… wait for the ding' : 'E — put raw veg on the board to chop';
    else if (station.kind === 'grill') hint = game.grill.item ? 'Grilling… take it when it dings' : 'E — put a raw patty on the grill';
    else if (station.kind === 'plating') hint = game.plate ? 'E — pick the plate up, or add more food' : 'E — start a plate with what you carry';
    else if (station.kind === 'window') hint = 'E — serve the plate you carry';
    else if (station.kind === 'trash') hint = 'E — throw away what you carry';
  }
  const mouseNear = input.mouse.inside;
  const y = VIEW.height - 52;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  roundRect(ctx, 16, y - 16, 560, 32, 12);
  ctx.fill();
  text(ctx, hint, 30, y, 15, '#ffe9c4', 600);
  void mouseNear;
}

// ---------------------------------------------------------------- screens

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'SIZZLE & SERVE', VIEW.width / 2, 168, 64, '#ffd94d', 800, 'center');
  text(ctx, 'a tiny kitchen rush — cook the tickets before they walk out', VIEW.width / 2, 216, 20, '#fff8e8', 600, 'center');
  const panelX = VIEW.width / 2 - 380;
  const panelY = 258;
  ctx.fillStyle = 'rgba(255,248,232,0.96)';
  roundRect(ctx, panelX, panelY, 760, 240, 16);
  ctx.fill();
  text(ctx, 'TODAY’S MENU', VIEW.width / 2, panelY + 26, 18, INK, 800, 'center');
  RECIPES.forEach((recipe, i) => {
    const y = panelY + 62 + i * 42;
    ctx.fillStyle = recipe.color;
    ctx.beginPath();
    ctx.arc(panelX + 30, y, 9, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, recipe.name, panelX + 52, y, 18, INK, 800);
    text(ctx, recipeNeedsText(recipe), panelX + 230, y, 13, '#6b5a44', 600);
    text(ctx, `${recipe.base} pts`, panelX + 730, y, 16, INK, 800, 'right');
  });
  text(ctx, 'Chop it. Grill it. Plate it. Serve it before the patience bar runs out.', VIEW.width / 2, 532, 18, '#ffe9c4', 600, 'center');
  text(ctx, 'WASD / arrows to move  •  E or click to use a station  •  3 hearts, 2½ minutes', VIEW.width / 2, 562, 16, '#d9b98a', 600, 'center');
  const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 300);
  text(ctx, 'PRESS ENTER OR CLICK TO START', VIEW.width / 2, 624, 22, `rgba(255,217,77,${pulse})`, 800, 'center');
  void game;
}

function drawGameOver(ctx, game) {
  ctx.fillStyle = 'rgba(20,12,6,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'SHIFT OVER!', VIEW.width / 2, 200, 56, '#ffd94d', 800, 'center');
  text(ctx, game.overReason, VIEW.width / 2, 248, 19, '#fff8e8', 600, 'center');
  const panelX = VIEW.width / 2 - 260;
  const panelY = 292;
  ctx.fillStyle = 'rgba(255,248,232,0.96)';
  roundRect(ctx, panelX, panelY, 520, 220, 16);
  ctx.fill();
  text(ctx, `SCORE  ${game.score}`, VIEW.width / 2, panelY + 44, 34, INK, 800, 'center');
  text(ctx, `Dishes served: ${game.servedCount}`, VIEW.width / 2, panelY + 104, 19, INK, 700, 'center');
  text(ctx, `Orders lost: ${game.expiredCount}    •    Best combo: ${game.bestCombo}`, VIEW.width / 2, panelY + 140, 19, INK, 700, 'center');
  text(ctx, game.servedCount >= 8 ? 'Head chef material. The rush never stood a chance.' : game.servedCount >= 4 ? 'Solid shift — the grill stayed hot and so did you.' : 'The kitchen humbled you. One more shift?', VIEW.width / 2, panelY + 178, 16, '#6b5a44', 600, 'center');
  const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 300);
  text(ctx, 'PRESS R TO COOK AGAIN', VIEW.width / 2, 580, 22, `rgba(255,217,77,${pulse})`, 800, 'center');
}

// ---------------------------------------------------------------- the frame

/** Draw one whole frame of `game` at time `now` (milliseconds). */
export function drawGame(ctx, game, input, now) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx);
  for (const station of Object.values(STATIONS)) {
    if (station.kind === 'pantry') drawPantryBin(ctx, station, now);
  }
  drawBoard(ctx, game, now);
  drawGrill(ctx, game, now);
  drawPlating(ctx, game);
  drawWindow(ctx, game, now);
  drawTrash(ctx);
  drawPlayer(ctx, game, now);
  drawFloats(ctx, game);
  drawOrderBoard(ctx, game, now);
  drawTimerAndScore(ctx, game, now);
  if (game.screen === 'play') drawHint(ctx, game, input);
  drawBanner(ctx, game);
  drawMessage(ctx, game);
  if (game.screen === 'title') drawTitle(ctx, game);
  if (game.screen === 'over') drawGameOver(ctx, game);
}
