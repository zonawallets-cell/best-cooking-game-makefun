// The order board: tickets arrive, wait with draining patience, and are
// served or lost. Nothing here draws or moves the chef; it only owns the
// queue and the rules for matching a finished plate to a ticket.
import {
  MAX_ORDERS,
  ORDER_PATIENCE_SECONDS,
  ORDER_SPAWN_END_SECONDS,
  ORDER_SPAWN_START_SECONDS,
} from './config.js';
import { RECIPES } from './recipes.js';
import { randomPick } from './random.js';

let nextOrderId = 1;

/** A fresh, empty order queue. */
export function createOrderQueue() {
  return { orders: [], spawnIn: 6 };
}

/** One new ticket, its recipe drawn from the menu. */
export function spawnOrder(queue, random) {
  const recipe = randomPick(random, RECIPES);
  const order = {
    id: nextOrderId,
    recipe,
    patience: ORDER_PATIENCE_SECONDS,
    maxPatience: ORDER_PATIENCE_SECONDS,
  };
  nextOrderId += 1;
  queue.orders.push(order);
  return order;
}

/** How many seconds until the next ticket, shorter as the shift wears on. */
export function spawnInterval(elapsedFraction) {
  const t = Math.max(0, Math.min(1, elapsedFraction));
  return ORDER_SPAWN_START_SECONDS + (ORDER_SPAWN_END_SECONDS - ORDER_SPAWN_START_SECONDS) * t;
}

/**
 * Advance the queue by `dt` seconds: drain patience, drop expired tickets
 * (each one reported through `onExpired`), and spawn the next ticket when
 * its time comes. Returns the list of orders that expired this tick.
 */
export function tickOrders(queue, dt, random, elapsedFraction) {
  const expired = [];
  for (const order of queue.orders) order.patience -= dt;
  queue.orders = queue.orders.filter((order) => {
    if (order.patience > 0) return true;
    expired.push(order);
    return false;
  });
  queue.spawnIn -= dt;
  if (queue.spawnIn <= 0 && queue.orders.length < MAX_ORDERS) {
    spawnOrder(queue, random);
    queue.spawnIn = spawnInterval(elapsedFraction);
  }
  return expired;
}

/** Whether a plate's finished items are exactly a recipe's needs, in any order. */
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.needs.length) return false;
  const remaining = recipe.needs.map((need) => `${need.kind}:${need.prep}`);
  for (const item of plateItems) {
    const key = `${item.kind}:${item.prep}`;
    const at = remaining.indexOf(key);
    if (at < 0) return false;
    remaining.splice(at, 1);
  }
  return remaining.length === 0;
}

/** The first ticket a finished plate satisfies, or null when none wants it. */
export function findMatchingOrder(orders, plateItems) {
  for (const order of orders) {
    if (plateMatchesRecipe(plateItems, order.recipe)) return order;
  }
  return null;
}
