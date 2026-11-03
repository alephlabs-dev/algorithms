import type { SortAlgorithm } from "./types";

export const selectionSort: SortAlgorithm = function* (arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < n; j++) {
      yield { type: "compare", i: j, j: minIndex };
      if (arr[j] < arr[minIndex]) minIndex = j;
    }
    if (minIndex !== i) yield { type: "swap", i, j: minIndex };
    yield { type: "done", indices: [i] };
  }
};
