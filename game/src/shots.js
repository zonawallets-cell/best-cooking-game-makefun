// The screenshot scenes behind ?shot=cover|rush|serve|title. Each one
// builds a real game state with the game's own constructors and rules —
// orders spawned from the menu, items placed through the same objects the
// live game uses — then freezes it, so the frame the browser renders is
// what a short game really looks like at that moment. The same seed
// always gives the same frame.
import { createGameState, addFloat, showBanner } from './kitchen.js';
import { spawnOrder } from './orders.js';
import { RECIPES } from './recipes.js';

export const SHOT_NAMES = ['cover', 'rush', 'serve', 'title'];

function recipeById(id) {
  return RECIPES.find((recipe) => recipe.id === id);
}

/** A ticket for `recipeId` with `patienceFraction` of its patience left. */
function stagedOrder(game, recipeId, patienceFraction) {
  const order = spawnOrder(game.queue, game.random);
  order.recipe = recipeById(recipeId);
  order.patience = order.maxPatience * patienceFraction;
  return order;
}

/**
 * The cover: a full kitchen mid-shift — three tickets on the board, a
 * burger mid-assembly on the plating counter, a patty sizzling on the
 * grill, chopped lettuce on the board, and the chef carrying a chopped
 * tomato toward the plate.
 */
function buildCoverScene() {
  const game = createGameState(7);
  game.screen = 'play';
  game.timeLeft = 96;
  game.elapsed = 54;
  game.score = 240;
  game.combo = 2;
  game.queue.orders = [];
  stagedOrder(game, 'salad', 0.62);
  stagedOrder(game, 'burger', 0.45);
  stagedOrder(game, 'deluxe', 0.8);
  game.player.x = 620;
  game.player.y = 430;
  game.player.facing = 1;
  game.player.carrying = [{ kind: 'tomato', prep: 'chopped' }];
  game.board.item = { kind: 'lettuce', prep: 'chopped' };
  game.board.progress = 1;
  game.grill.item = { kind: 'patty', prep: 'raw' };
  game.grill.progress = 2.2;
  game.plate = {
    kind: 'plate',
    items: [
      { kind: 'bread', prep: 'ready' },
      { kind: 'patty', prep: 'cooked' },
    ],
  };
  return game;
}

/**
 * The rush: the last half-minute, four tickets, one about to walk out,
 * a finished Deluxe Stack on the counter and a burnt patty smoking on
 * the grill — the service rush readable at a glance.
 */
function buildRushScene() {
  const game = createGameState(21);
  game.screen = 'play';
  game.timeLeft = 28;
  game.elapsed = 122;
  game.score = 610;
  game.combo = 4;
  game.queue.orders = [];
  stagedOrder(game, 'burger', 0.12);
  stagedOrder(game, 'salad', 0.38);
  stagedOrder(game, 'deluxe', 0.55);
  stagedOrder(game, 'melt', 0.71);
  game.player.x = 900;
  game.player.y = 560;
  game.player.facing = 1;
  game.player.carrying = [
    {
      kind: 'plate',
      items: [
        { kind: 'bread', prep: 'ready' },
        { kind: 'patty', prep: 'cooked' },
        { kind: 'lettuce', prep: 'chopped' },
      ],
    },
  ];
  game.board.item = { kind: 'onion', prep: 'raw' };
  game.board.progress = 0.7;
  game.grill.item = { kind: 'patty', prep: 'burnt' };
  game.grill.progress = 9.5;
  game.plate = {
    kind: 'plate',
    items: [
      { kind: 'bread', prep: 'ready' },
      { kind: 'patty', prep: 'cooked' },
      { kind: 'tomato', prep: 'chopped' },
      { kind: 'onion', prep: 'chopped' },
      { kind: 'cheese', prep: 'ready' },
    ],
  };
  addFloat(game, 1000, 580, '+130', '#ffd94d');
  return game;
}

/**
 * The serve: the chef at the window with a finished Classic Burger and
 * the SERVED banner up — the plate ready to serve, the moment the whole
 * game builds toward.
 */
function buildServeScene() {
  const game = createGameState(42);
  game.screen = 'play';
  game.timeLeft = 74;
  game.elapsed = 76;
  game.score = 358;
  game.combo = 3;
  game.queue.orders = [];
  stagedOrder(game, 'salad', 0.7);
  stagedOrder(game, 'deluxe', 0.5);
  game.player.x = 1150;
  game.player.y = 540;
  game.player.facing = -1;
  game.player.carrying = [
    {
      kind: 'plate',
      items: [
        { kind: 'bread', prep: 'ready' },
        { kind: 'patty', prep: 'cooked' },
        { kind: 'lettuce', prep: 'chopped' },
      ],
    },
  ];
  game.grill.item = { kind: 'patty', prep: 'cooked' };
  game.grill.progress = 4.2;
  game.board.item = { kind: 'tomato', prep: 'chopped' };
  game.board.progress = 1;
  showBanner(game, 'SERVED!', 'Classic Burger  •  +118 pts  •  x1.2 combo', '#7ddc8a');
  addFloat(game, 1000, 580, '+118', '#ffd94d');
  return game;
}

/** The title screen over a kitchen already stocked with tickets. */
function buildTitleScene() {
  const game = createGameState(3);
  game.screen = 'title';
  game.queue.orders = [];
  stagedOrder(game, 'burger', 0.9);
  stagedOrder(game, 'salad', 0.75);
  game.plate = {
    kind: 'plate',
    items: [
      { kind: 'bread', prep: 'ready' },
      { kind: 'cheese', prep: 'ready' },
    ],
  };
  game.grill.item = { kind: 'patty', prep: 'raw' };
  game.grill.progress = 1.5;
  return game;
}

/** The frozen game state for a named shot, or null for an unknown name. */
export function buildShotScene(name) {
  if (name === 'cover') return buildCoverScene();
  if (name === 'rush') return buildRushScene();
  if (name === 'serve') return buildServeScene();
  if (name === 'title') return buildTitleScene();
  return null;
}
