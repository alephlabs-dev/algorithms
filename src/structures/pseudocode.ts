import type { StructureAlgorithm } from "./types";

// Line numbers are LINE in tree.ts. Short enough to fit the code card without wrapping.
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
};
