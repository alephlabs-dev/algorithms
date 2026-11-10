import type { Random } from "./random";
import type { InputOrder } from "@/types";


export const MIN_ITEM = 5;
export const MAX_ITEM = 50;

/** Up to this size, values are random in MIN_ITEM..MAX_ITEM, which reads well as numbers. */
const SMALL_ARRAY = 40;
const FEW_UNIQUE_LEVELS = 5;

export const generateUniqueRandomItems = (
  count: number,
  min: number = MIN_ITEM,
  max: number = MAX_ITEM,
  random: Random = Math.random
): number[] => {
  const items = new Set<number>();
  while (items.size < count) {
    items.add(Math.round(random() * (max - min) + min));
  }
  return Array.from(items);
};

const shuffle = (items: number[], random: Random) => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

export const generateItems = (
  count: number,
  order: InputOrder,
  random: Random = Math.random
): number[] => {
  if (order === "fewUnique") {
    // A handful of distinct heights, repeated, to show how algorithms handle ties.
    const step = MAX_ITEM / FEW_UNIQUE_LEVELS;
    return Array.from(
      { length: count },
      () => step * (1 + Math.floor(random() * FEW_UNIQUE_LEVELS))
    );
  }

  // Large arrays use 1..count so every bar has a distinct height.
  const items =
    count <= SMALL_ARRAY
      ? generateUniqueRandomItems(count, MIN_ITEM, MAX_ITEM, random)
      : shuffle(Array.from({ length: count }, (_, k) => k + 1), random);
  if (order === "random") return items;

  items.sort((a, b) => a - b);
  if (order === "sorted") return items;
  if (order === "reversed") return items.reverse();

  // Nearly sorted: swap roughly 10% of the items with a neighbour.
  const swaps = Math.max(1, Math.round(count / 10));
  for (let k = 0; k < swaps && count > 1; k++) {
    const i = Math.floor(random() * (count - 1));
    [items[i], items[i + 1]] = [items[i + 1], items[i]];
  }
  return items;
};
