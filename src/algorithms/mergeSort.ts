import { range } from "./timeline";
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
  yield { type: "highlight", active: range(lo, hi), temp: [], focus: range(lo, hi) };

  const left = arr.slice(lo, mid);
  const right = arr.slice(mid, hi);
  const merged: number[] = [];

  while (left.length || right.length) {
    // The range currently reads [...merged, ...left, ...right].
    const target = lo + merged.length;
    const rightIndex = target + left.length;
    let takeLeft: boolean;
    if (left.length && right.length) {
      yield { type: "compare", i: target, j: rightIndex };
      // `<=` takes from the left on ties, which keeps the sort stable.
      takeLeft = left[0] <= right[0];
    } else {
      takeLeft = left.length > 0;
    }
    merged.push(takeLeft ? left.shift()! : right.shift()!);

    // Taking from the left writes the value in place; taking from the right
    // moves it in front of what's left of the left half.
    yield {
      type: "move",
      from: takeLeft ? target : rightIndex,
      to: target,
      temp: range(lo, lo + merged.length),
    };
  }
}

export const mergeSort: SortAlgorithm = (arr) => sortRange(arr, 0, arr.length);
