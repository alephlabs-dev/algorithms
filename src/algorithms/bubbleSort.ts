import type { SortAlgorithm } from "./types";

export const bubbleSort: SortAlgorithm = function* (arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      yield { type: "compare", i: j, j: j + 1 };
      if (arr[j] > arr[j + 1]) {
        yield { type: "swap", i: j, j: j + 1 };
        swapped = true;
      }
    }
    // A pass without swaps means the rest is already sorted (best case O(n)).
    if (!swapped) return;
    // The largest remaining value has bubbled up to the end.
    yield { type: "done", indices: [n - 1 - i] };
  }
};
