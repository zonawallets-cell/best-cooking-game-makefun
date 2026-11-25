// Keyboard and mouse, translated into game terms. The canvas is a fixed
// 1280x800 logical space scaled by CSS, so mouse positions are mapped back
// through the canvas bounding box before anything reads them.
import { VIEW } from './config.js';

const MOVE_KEYS = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

/** Wire the canvas and the window; returns the live input state. */
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouse: { x: 0, y: 0, inside: false },
    clicked: null,
    pressedKeys: [],
  };
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    input.keys.add(event.code);
    input.pressedKeys.push(event.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.code);
  });
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((event.clientX - rect.left) / rect.width) * VIEW.width;
    input.mouse.y = ((event.clientY - rect.top) / rect.height) * VIEW.height;
    input.mouse.inside = true;
  });
  canvas.addEventListener('mouseleave', () => {
    input.mouse.inside = false;
  });
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.clicked = {
      x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
      y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
    };
  });
  return input;
}

/** The movement direction held right now, as -1/0/1 on each axis. */
export function movementDirection(input) {
  let dx = 0;
  let dy = 0;
  for (const code of input.keys) {
    const direction = MOVE_KEYS[code];
    if (direction === 'up') dy -= 1;
    if (direction === 'down') dy += 1;
    if (direction === 'left') dx -= 1;
    if (direction === 'right') dx += 1;
  }
  return { dx, dy };
}

/** Whether a key was pressed since the last call (consumes it). */
export function wasPressed(input, code) {
  const at = input.pressedKeys.indexOf(code);
  if (at < 0) return false;
  input.pressedKeys.splice(at, 1);
  return true;
}

/** Whether any of the given keys was pressed since the last call. */
export function wasAnyPressed(input, codes) {
  return codes.some((code) => wasPressed(input, code));
}

/** The mouse click since the last call, or null (consumes it). */
export function takeClick(input) {
  const click = input.clicked;
  input.clicked = null;
  return click;
}
