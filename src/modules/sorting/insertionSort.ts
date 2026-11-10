import { range } from "./timeline";
import type { SortAlgorithm } from "./types";

export const insertionPseudocode = [
  "for i from 1 to n-1:",
  "  # insert a[i] into sorted a[0..i-1]",
  "  j = i",
  "  while j > 0 and a[j-1] > a[j]:",
  "    swap a[j-1] and a[j]",
  "    j = j - 1",
];

export const insertionSort: SortAlgorithm = function* (arr) {
  for (let i = 1; i < arr.length; i++) {
    // Highlight the sorted prefix plus the value being inserted.
    yield { type: "highlight", temp: range(0, i + 1), line: 1 };
    // Walk the new value left until it meets a smaller one.
    for (let j = i; j > 0; j--) {
      yield { type: "compare", i: j - 1, j, line: 3 };
      if (arr[j - 1] <= arr[j]) break;
      yield { type: "swap", i: j - 1, j, line: 4 };
    }
  }
};
