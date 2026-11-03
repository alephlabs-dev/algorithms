import { range } from "./timeline";
import type { SortAlgorithm, Step } from "./types";

export const quickPseudocode = [
  "quicksort(lo, hi):",
  "  if lo >= hi: done, return",
  "  pivot = a[hi]",
  "  store = lo",
  "  for i from lo to hi-1:",
  "    if a[i] < pivot:",
  "      swap a[i] and a[store]",
  "      store = store + 1",
  "  swap a[store] and a[hi]",
  "  pivot is in its final place",
  "  quicksort(lo, store-1)",
  "  quicksort(store+1, hi)",
];

// Lomuto partition with the last element as pivot.
function* sortRange(
  arr: readonly number[],
  lo: number,
  hi: number
): Generator<Step, void> {
  if (lo > hi) return;
  if (lo === hi) {
    yield { type: "done", indices: [lo], line: 1 };
    return;
  }

  // Dim everything outside this partition and mark the pivot.
  yield { type: "highlight", focus: range(lo, hi + 1), pivot: hi, temp: [], line: 2 };

  // Everything left of `store` is smaller than the pivot.
  let store = lo;
  for (let i = lo; i < hi; i++) {
    yield { type: "compare", i, j: hi, line: 5 };
    if (arr[i] < arr[hi]) {
      if (i !== store) {
        yield { type: "swap", i, j: store, temp: range(lo, store + 1), line: 6 };
      } else {
        yield { type: "highlight", temp: range(lo, store + 1), line: 7 };
      }
      store++;
    }
  }

  if (store !== hi) yield { type: "swap", i: store, j: hi, line: 8 };
  // The pivot is now in its final place.
  yield { type: "done", indices: [store], temp: [], pivot: null, line: 9 };

  yield* sortRange(arr, lo, store - 1);
  yield* sortRange(arr, store + 1, hi);
}

export const quickSort: SortAlgorithm = (arr) => sortRange(arr, 0, arr.length - 1);
