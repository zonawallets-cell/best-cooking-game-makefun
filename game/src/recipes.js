// The pantry and the menu: every ingredient, what it needs before it can
// be served, and the four recipes the order board can ask for. A recipe is
// a set of finished items, so the same ingredients combine in different
// ways across the menu and the player plans one route through the kitchen
// per ticket, not one button per dish.

export const INGREDIENTS = {
  tomato: { name: 'Tomato', color: '#e2452f', dark: '#a92c1d', needs: 'chop' },
  lettuce: { name: 'Lettuce', color: '#58b368', dark: '#2f7d3d', needs: 'chop' },
  onion: { name: 'Onion', color: '#b678c9', dark: '#7d4a94', needs: 'chop' },
  cheese: { name: 'Cheese', color: '#f6c945', dark: '#c99a1e', needs: 'none' },
  patty: { name: 'Patty', color: '#8a5a33', dark: '#5d3a1e', needs: 'grill' },
  bread: { name: 'Bread', color: '#e8b96a', dark: '#b98a3e', needs: 'none' },
};

export const INGREDIENT_KINDS = Object.keys(INGREDIENTS);

/** What a raw ingredient becomes once its station job is done. */
export function finishedPrep(kind) {
  if (INGREDIENTS[kind].needs === 'chop') return 'chopped';
  if (INGREDIENTS[kind].needs === 'grill') return 'cooked';
  return 'ready';
}

/** Whether `item` still needs a station job before it can go on a plate. */
export function needsPrep(item) {
  return item.prep === 'raw' && INGREDIENTS[item.kind].needs !== 'none';
}

/** A fresh raw ingredient, straight from its pantry bin. */
export function freshIngredient(kind) {
  return { kind, prep: 'raw' };
}

// A recipe's `needs` is the finished item each plate must hold, in any
// order: { kind, prep } with prep 'chopped', 'cooked' or 'ready'.
export const RECIPES = [
  {
    id: 'salad',
    name: 'Garden Salad',
    base: 40,
    color: '#58b368',
    needs: [
      { kind: 'tomato', prep: 'chopped' },
      { kind: 'lettuce', prep: 'chopped' },
    ],
  },
  {
    id: 'melt',
    name: 'Cheese Toast',
    base: 55,
    color: '#f6c945',
    needs: [
      { kind: 'bread', prep: 'ready' },
      { kind: 'cheese', prep: 'ready' },
    ],
  },
  {
    id: 'burger',
    name: 'Classic Burger',
    base: 90,
    color: '#e2452f',
    needs: [
      { kind: 'bread', prep: 'ready' },
      { kind: 'patty', prep: 'cooked' },
      { kind: 'lettuce', prep: 'chopped' },
    ],
  },
  {
    id: 'deluxe',
    name: 'Deluxe Stack',
    base: 130,
    color: '#b678c9',
    needs: [
      { kind: 'bread', prep: 'ready' },
      { kind: 'patty', prep: 'cooked' },
      { kind: 'tomato', prep: 'chopped' },
      { kind: 'onion', prep: 'chopped' },
      { kind: 'cheese', prep: 'ready' },
    ],
  },
];

/** The short list of finished items a recipe's ticket shows. */
export function recipeNeedsText(recipe) {
  return recipe.needs
    .map((need) => `${need.prep === 'ready' ? '' : `${need.prep} `}${INGREDIENTS[need.kind].name}`)
    .join(' + ');
}
