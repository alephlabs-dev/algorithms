import type { StructureAlgorithm } from "./types";

// Line numbers are LINE in tree.ts, HEAP_LINE in heap.ts and HASH_LINE in hash.ts. Short enough to fit the code card without wrapping.
const bst = [
  "insert(v): from the root",
  "  go left if smaller, else right",
  "  put v where the way runs out",
  "search(v): from the root",
  "  equal: found; else left/right",
  "  ran out: v isn't there",
  "delete(v): from the root",
  "  find v, as in search",
  "  0 or 1 child: it moves up",
  "  2: copy the next value, delete it",
];

export const structurePseudocode: Record<StructureAlgorithm, string[]> = {
  bst,
  avl: [...bst, "then, back up the path:", "  height, balance = left − right", "  balance ±2: rotate to fix it"],
  heap: [
    "insert(v): add v at the end",
    "  while v < its parent: swap up",
    "find(v): no order to follow,",
    "  so check slot after slot",
    "pop(): take out the root, the min",
    "  move the last value to the root",
    "  compare with the smaller child:",
    "    bigger? swap down, repeat",
  ],
  chaining: [
    "insert(v): i = v mod m",
    "  walk bucket i: there? stop",
    "  add v to the end of bucket i",
    "find(v): i = v mod m",
    "  walk bucket i, comparing",
    "  end of the bucket: not there",
    "delete(v): i = v mod m",
    "  walk bucket i to find v",
    "  unlink it from the bucket",
  ],
  probing: [
    "insert(v): i = v mod m",
    "  taken? try i+1, i+2, … (wrap)",
    "  put v in the first free slot",
    "find(v): i = v mod m",
    "  check slots from i onward",
    "  empty slot: v isn't there",
    "delete(v): i = v mod m, find v",
    "  as in find",
    "  leave a marker: finds go past it",
  ],
};
