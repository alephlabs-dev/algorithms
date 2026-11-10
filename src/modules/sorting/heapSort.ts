import { range } from "./timeline";
import type { SortAlgorithm, Step } from "./types";

export const heapPseudocode = [
  "build max-heap:",
  "  for i from n/2-1 down to 0:",
  "    sift_down(i, n)",
  "for end from n-1 down to 1:",
  "  swap a[0] and a[end]",
  "  a[end] is in its final place",
  "  sift_down(0, end)",
  "sift_down(i, size):",
  "  child = larger of a[2i+1], a[2i+2]",
  "  if a[child] > a[i]:",
  "    swap a[i] and a[child]; repeat",
  "  else: stop",
];

// Push arr[i] down until both children are smaller, within arr[0, size).
function* siftDown(
  arr: readonly number[],
  start: number,
  size: number
): Generator<Step, void> {
  let i = start;
  for (;;) {
    const left = 2 * i + 1;
    if (left >= size) return;
    let child = left;
    const right = left + 1;
    if (right < size) {
      yield { type: "compare", i: left, j: right, line: 8 };
      if (arr[right] > arr[left]) child = right;
    }
    yield { type: "compare", i: child, j: i, line: 9 };
    if (arr[child] <= arr[i]) {
      yield { type: "highlight", line: 11 };
      return;
    }
    yield { type: "swap", i, j: child, line: 10 };
    i = child;
  }
}

export const heapSort: SortAlgorithm = function* (arr) {
  const n = arr.length;
  if (n < 2) return;

  yield { type: "highlight", line: 0 };
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    // A new sift-down: the last pair compared stops being lit.
    yield { type: "highlight", active: [], line: 2 };
    yield* siftDown(arr, i, n);
  }

  for (let end = n - 1; end > 0; end--) {
    // The max sits at the root: move it to the end of the heap.
    yield { type: "swap", i: 0, j: end, line: 4 };
    yield { type: "done", indices: [end], focus: range(0, end), line: 5 };
    yield { type: "highlight", active: [], line: 6 };
    yield* siftDown(arr, 0, end);
  }
};
