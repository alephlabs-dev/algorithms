import { range } from "./timeline";
import type { SortAlgorithm } from "./types";

export const radixPseudocode = [
  "for each digit, ones place first:",
  "  placed = 0",
  "  for d from 0 to 9:",
  "    for each unplaced x, in order:",
  "      if digit(x) == d:",
  "        move x to position placed",
  "        placed = placed + 1",
];

const digitAt = (value: number, exp: number) => Math.floor(value / exp) % 10;

// LSD radix sort, base 10. Never compares two values: each pass distributes
// items by one digit, and the pass is stable, so earlier digits stay in order.
export const radixSort: SortAlgorithm = function* (arr) {
  const n = arr.length;
  if (n < 2) return;
  const max = Math.max(...arr);

  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    yield { type: "highlight", temp: [], line: 0, place: exp };
    let placed = 0;
    for (let d = 0; d <= 9; d++) {
      // Moving an item to `placed` shifts the ones in between right by one,
      // which keeps the unplaced items in their original order.
      for (let k = placed; k < n; k++) {
        if (digitAt(arr[k], exp) !== d) continue;
        yield { type: "move", from: k, to: placed, temp: range(0, placed + 1), line: 5 };
        placed++;
      }
    }
  }
};
