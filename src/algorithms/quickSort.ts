import { range } from "./timeline";
import type { SortAlgorithm, Step } from "./types";

// Lomuto partition with the last element as pivot.
function* sortRange(
  arr: readonly number[],
  lo: number,
  hi: number
): Generator<Step, void> {
  if (lo > hi) return;
  if (lo === hi) {
    yield { type: "done", indices: [lo] };
    return;
  }

  // Dim everything outside this partition and mark the pivot.
  yield { type: "highlight", focus: range(lo, hi + 1), pivot: hi, temp: [] };

  // Everything left of `store` is smaller than the pivot.
  let store = lo;
  for (let i = lo; i < hi; i++) {
    yield { type: "compare", i, j: hi };
    if (arr[i] < arr[hi]) {
      if (i !== store) {
        yield { type: "swap", i, j: store, temp: range(lo, store + 1) };
      } else {
        yield { type: "highlight", temp: range(lo, store + 1) };
      }
      store++;
    }
  }

  if (store !== hi) yield { type: "swap", i: store, j: hi };
  // The pivot is now in its final place.
  yield { type: "done", indices: [store], temp: [], pivot: null };

  yield* sortRange(arr, lo, store - 1);
  yield* sortRange(arr, store + 1, hi);
}

export const quickSort: SortAlgorithm = (arr) => sortRange(arr, 0, arr.length - 1);
