import type { SortAlgorithm } from "./types";

export const selectionPseudocode = [
  "for i from 0 to n-2:",
  "  min = i",
  "  for j from i+1 to n-1:",
  "    if a[j] < a[min]: min = j",
  "  swap a[i] and a[min]",
  "  a[i] is in its final place",
];

export const selectionSort: SortAlgorithm = function* (arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < n; j++) {
      yield { type: "compare", i: j, j: minIndex, line: 3 };
      if (arr[j] < arr[minIndex]) minIndex = j;
    }
    if (minIndex !== i) yield { type: "swap", i, j: minIndex, line: 4 };
    yield { type: "done", indices: [i], line: 5 };
  }
};
