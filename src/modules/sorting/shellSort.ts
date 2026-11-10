import type { SortAlgorithm } from "./types";

export const shellPseudocode = [
  "gap = n / 2",
  "while gap > 0:",
  "  for i from gap to n-1:",
  "    j = i",
  "    while j >= gap and a[j-gap] > a[j]:",
  "      swap a[j-gap] and a[j]",
  "      j = j - gap",
  "  gap = gap / 2",
];

// Positions in the same gap group as `i`, up to `i`: i, i-gap, i-2·gap, …
const gapGroup = (i: number, gap: number) => {
  const group: number[] = [];
  for (let k = i % gap; k <= i; k += gap) group.push(k);
  return group;
};

// Insertion sort on items `gap` apart, with the gap halving down to 1.
export const shellSort: SortAlgorithm = function* (arr) {
  const n = arr.length;
  let firstGap = true;
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    yield { type: "highlight", temp: [], line: firstGap ? 0 : 7 };
    firstGap = false;
    for (let i = gap; i < n; i++) {
      for (let j = i; j >= gap; j -= gap) {
        // Show the gap group being insertion-sorted when we start on `i`.
        const temp = j === i ? gapGroup(i, gap) : undefined;
        yield { type: "compare", i: j - gap, j, temp, line: 4 };
        if (arr[j - gap] <= arr[j]) break;
        yield { type: "swap", i: j - gap, j, line: 5 };
      }
    }
  }
};
