// Sizzle & Serve: boot, the game loop, and the screens. The loop reads
// input, moves the chef, ticks the kitchen and draws one frame; a shot
// query (?shot=cover|rush|serve|title) freezes a staged scene instead so
// screenshots render the real game at its best moments.
import { VIEW } from './config.js';
import { createSoundBoard } from './audio.js';
import { createInput, movementDirection, takeClick, wasAnyPressed, wasPressed } from './input.js';
import {
  createGameState,
  interact,
  movePlayer,
  nearestStation,
  startShift,
  stationAtPoint,
  updateGame,
} from './kitchen.js';
import { drawGame } from './render.js';
import { buildShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) ? seedParam : Math.floor(Date.now() % 2147483647);

let game;
let shotMode = false;
if (shotName) {
  game = buildShotScene(shotName);
  if (game) {
    shotMode = true;
    document.title = 'SHOT-OK';
  }
}
if (!game) game = createGameState(seed);

const input = createInput(canvas);
const sounds = createSoundBoard();

// Exposed for automated play-testing only: the live game state.
window.__sizzleGame = game;

/** Drain the kitchen's sound events into the sound board. */
function drainEvents() {
  for (const event of game.events) sounds.play(event.type);
  game.events.length = 0;
}

function announceStatus() {
  if (statusLine) {
    statusLine.textContent = game.screen === 'play'
      ? `Score ${game.score}, ${Math.ceil(game.timeLeft)} seconds left, ${game.queue.orders.length} orders waiting.`
      : game.screen === 'over'
        ? `Shift over. Score ${game.score}, ${game.servedCount} dishes served.`
        : 'Sizzle and Serve. Press Enter to start cooking.';
  }
}

function handleScreens() {
  if (game.screen === 'title') {
    const click = takeClick(input);
    if (wasAnyPressed(input, ['Enter', 'Space']) || click) {
      sounds.unlock();
      startShift(game);
      sounds.play('pickup');
    }
    return;
  }
  if (game.screen === 'over') {
    if (wasPressed(input, 'KeyR') || takeClick(input)) {
      sounds.unlock();
      startShift(game);
    }
  }
}

function handlePlay(dt) {
  const { dx, dy } = movementDirection(input);
  movePlayer(game, dx, dy, dt);
  if (wasAnyPressed(input, ['KeyE', 'Space'])) {
    sounds.unlock();
    interact(game, nearestStation(game));
  }
  const click = takeClick(input);
  if (click) {
    sounds.unlock();
    interact(game, stationAtPoint(game, click.x, click.y));
  }
  if (wasPressed(input, 'KeyM')) {
    const muted = sounds.toggleMute();
    document.title = muted ? 'Sizzle & Serve (muted)' : 'Sizzle & Serve';
  }
  updateGame(game, dt);
}

let lastNow = performance.now();
let announcedAt = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - lastNow) / 1000);
  lastNow = now;
  if (!shotMode) {
    handleScreens();
    if (game.screen === 'play') handlePlay(dt);
    drainEvents();
    if (now - announcedAt > 5000) {
      announcedAt = now;
      announceStatus();
    }
  }
  drawGame(ctx, game, input, now);
  requestAnimationFrame(frame);
}

window.addEventListener('error', (event) => {
  document.title = `SHOT-ERROR: ${event.message}`;
});

canvas.width = VIEW.width;
canvas.height = VIEW.height;
drawGame(ctx, game, input, performance.now());
requestAnimationFrame(frame);
