import { range } from "./recordFrames";
import type { SortAlgorithm, Step } from "./types";

// Sorts arr[lo, hi) (hi exclusive).
function* sortRange(
  arr: readonly number[],
  lo: number,
  hi: number
): Generator<Step, void> {
  if (hi - lo <= 1) return;

  const mid = Math.floor((lo + hi) / 2);
  yield* sortRange(arr, lo, mid);
  yield* sortRange(arr, mid, hi);

  // Show the two halves about to be merged.
  yield { type: "highlight", active: range(lo, hi), temp: [] };

  const left = arr.slice(lo, mid);
  const right = arr.slice(mid, hi);
  const merged: number[] = [];

  while (left.length || right.length) {
    let takeLeft: boolean;
    if (left.length && right.length) {
      // The array currently reads [...merged, ...left, ...right] in this range.
      const leftIndex = lo + merged.length;
      yield { type: "compare", i: leftIndex, j: leftIndex + left.length };
      // `<=` takes from the left on ties, which keeps the sort stable.
      takeLeft = left[0] <= right[0];
    } else {
      takeLeft = left.length > 0;
    }
    merged.push(takeLeft ? left.shift()! : right.shift()!);

    yield {
      type: "overwrite",
      start: lo,
      values: [...merged, ...left, ...right],
      temp: range(lo, lo + merged.length),
    };
  }
}

export const mergeSort: SortAlgorithm = (arr) => sortRange(arr, 0, arr.length);
