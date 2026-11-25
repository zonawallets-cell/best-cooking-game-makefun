// A tiny seeded random generator (mulberry32) so the screenshot scenes and
// any seeded run play out the same way every time. The live game seeds it
// from the clock; the shot scenes pass a fixed seed.

/** A function that returns a fresh pseudo-random number in [0, 1). */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** An integer from 0 to `max - 1`, drawn from `random`. */
export function randomInt(random, max) {
  return Math.floor(random() * max);
}

/** One element of `items`, picked by `random`. */
export function randomPick(random, items) {
  return items[randomInt(random, items.length)];
}
