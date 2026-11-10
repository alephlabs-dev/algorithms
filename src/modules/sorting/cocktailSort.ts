import type { SortAlgorithm } from "./types";

export const cocktailPseudocode = [
  "lo, hi = 0, n-1",
  "while lo < hi:",
  "  # forward: carry the max right",
  "  for j from lo to hi-1:",
  "    if a[j] > a[j+1]: swap them",
  "  a[hi] is in place; hi = hi - 1",
  "  # backward: carry the min left",
  "  for j from hi down to lo+1:",
  "    if a[j-1] > a[j]: swap them",
  "  a[lo] is in place; lo = lo + 1",
  "  if a pass made no swaps: stop",
];

// Bubble sort in both directions, so small values near the end don't crawl.
export const cocktailSort: SortAlgorithm = function* (arr) {
  let lo = 0;
  let hi = arr.length - 1;
  while (lo < hi) {
    let swapped = false;
    for (let j = lo; j < hi; j++) {
      yield { type: "compare", i: j, j: j + 1, line: 4 };
      if (arr[j] > arr[j + 1]) {
        yield { type: "swap", i: j, j: j + 1, line: 4 };
        swapped = true;
      }
    }
    if (!swapped) {
      yield { type: "highlight", line: 10 };
      return;
    }
    yield { type: "done", indices: [hi], line: 5 };
    hi--;

    swapped = false;
    for (let j = hi; j > lo; j--) {
      yield { type: "compare", i: j - 1, j, line: 8 };
      if (arr[j - 1] > arr[j]) {
        yield { type: "swap", i: j - 1, j, line: 8 };
        swapped = true;
      }
    }
    if (!swapped) {
      yield { type: "highlight", line: 10 };
      return;
    }
    yield { type: "done", indices: [lo], line: 9 };
    lo++;
  }
};
