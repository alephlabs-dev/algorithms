import type { SortAlgorithm } from "./types";

export const bubblePseudocode = [
  "for i from 0 to n-2:",
  "  swapped = false",
  "  for j from 0 to n-2-i:",
  "    if a[j] > a[j+1]:",
  "      swap a[j] and a[j+1]",
  "      swapped = true",
  "  if not swapped: stop, it's sorted",
  "  a[n-1-i] is in its final place",
];

export const bubbleSort: SortAlgorithm = function* (arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      yield { type: "compare", i: j, j: j + 1, line: 3 };
      if (arr[j] > arr[j + 1]) {
        yield { type: "swap", i: j, j: j + 1, line: 4 };
        swapped = true;
      }
    }
    // A pass without swaps means the rest is already sorted (best case O(n)).
    if (!swapped) {
      yield { type: "highlight", line: 6 };
      return;
    }
    // The largest remaining value has bubbled up to the end.
    yield { type: "done", indices: [n - 1 - i], line: 7 };
  }
};
