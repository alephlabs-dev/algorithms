import type { InputOrder } from "@/types";

export const MIN_ITEM = 5;
export const MAX_ITEM = 50;

// Values are unique because the UI tracks bars (keys, highlights) by value.
export const generateUniqueRandomItems = (
  count: number,
  min: number = MIN_ITEM,
  max: number = MAX_ITEM
): number[] => {
  const items = new Set<number>();
  while (items.size < count) {
    const randomNum = Math.round(Math.random() * (max - min) + min);
    items.add(randomNum);
  }
  return Array.from(items);
};

const randomIndex = (length: number) => Math.floor(Math.random() * length);

export const generateItems = (count: number, order: InputOrder): number[] => {
  const items = generateUniqueRandomItems(count);
  if (order === "random") return items;

  items.sort((a, b) => a - b);
  if (order === "sorted") return items;
  if (order === "reversed") return items.reverse();

  // Nearly sorted: swap roughly 10% of the items with a neighbour.
  const swaps = Math.max(1, Math.round(count / 10));
  for (let k = 0; k < swaps && count > 1; k++) {
    const i = randomIndex(count - 1);
    [items[i], items[i + 1]] = [items[i + 1], items[i]];
  }
  return items;
};
