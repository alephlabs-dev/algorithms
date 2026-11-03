import { range } from "./recordFrames";
import type { SortAlgorithm } from "./types";

export const insertionSort: SortAlgorithm = function* (arr) {
  for (let i = 1; i < arr.length; i++) {
    // Highlight the sorted prefix plus the value being inserted.
    yield { type: "highlight", temp: range(0, i + 1) };
    // Walk the new value left until it meets a smaller one.
    for (let j = i; j > 0; j--) {
      yield { type: "compare", i: j - 1, j };
      if (arr[j - 1] <= arr[j]) break;
      yield { type: "swap", i: j - 1, j };
    }
  }
};
