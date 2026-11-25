// Sizzle & Serve: the numbers that tune the kitchen. One place for every
// constant the rest of the game reads, so a balance tweak never hunts
// through the logic files.
export const VIEW = { width: 1280, height: 800 };

// The strip across the top holds the order board, the shift timer and the
// score; the kitchen floor starts below it.
export const HUD_HEIGHT = 104;
export const SHIFT_SECONDS = 150;
export const MAX_HEARTS = 3;
export const HAND_SLOTS = 3;

// How long each station job takes, in seconds.
export const CHOP_SECONDS = 1.4;
export const GRILL_SECONDS = 4.0;
export const BURN_AFTER_SECONDS = 9.0;

// Orders: patience per ticket, and how fast new tickets arrive at the
// start of the shift versus the end (the rush that grows without chores).
export const ORDER_PATIENCE_SECONDS = 55;
export const ORDER_SPAWN_START_SECONDS = 15;
export const ORDER_SPAWN_END_SECONDS = 8;
export const MAX_ORDERS = 4;

export const PLAYER_SPEED = 290;
export const PLAYER_RADIUS = 26;
export const INTERACT_REACH = 78;

// The kitchen's stations, as floor rectangles. The player walks the open
// floor and works a station from its edge.
export const STATIONS = {
  pantryTomato: { id: 'pantryTomato', kind: 'pantry', item: 'tomato', x: 20, y: 120, w: 140, h: 80 },
  pantryLettuce: { id: 'pantryLettuce', kind: 'pantry', item: 'lettuce', x: 20, y: 212, w: 140, h: 80 },
  pantryOnion: { id: 'pantryOnion', kind: 'pantry', item: 'onion', x: 20, y: 304, w: 140, h: 80 },
  pantryCheese: { id: 'pantryCheese', kind: 'pantry', item: 'cheese', x: 20, y: 396, w: 140, h: 80 },
  pantryPatty: { id: 'pantryPatty', kind: 'pantry', item: 'patty', x: 20, y: 488, w: 140, h: 80 },
  pantryBread: { id: 'pantryBread', kind: 'pantry', item: 'bread', x: 20, y: 580, w: 140, h: 80 },
  board: { id: 'board', kind: 'board', x: 300, y: 596, w: 210, h: 112 },
  grill: { id: 'grill', kind: 'grill', x: 800, y: 130, w: 250, h: 120 },
  plating: { id: 'plating', kind: 'plating', x: 560, y: 596, w: 230, h: 112 },
  window: { id: 'window', kind: 'window', x: 1030, y: 596, w: 230, h: 112 },
  trash: { id: 'trash', kind: 'trash', x: 1080, y: 130, w: 120, h: 92 },
};

export const STATION_LIST = Object.values(STATIONS);

// The chef's starting spot, in the middle of the open floor.
export const PLAYER_START = { x: 640, y: 400 };
