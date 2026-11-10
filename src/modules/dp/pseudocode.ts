import type { DpAlgorithm } from "./types";

// Line numbers are DP_LINE in run.ts and KNAPSACK_LINE in knapsack.ts.
export const dpPseudocode: Record<DpAlgorithm, string[]> = {
  edit: [
    "D[i][0] = i; D[0][j] = j",
    "for each cell, row by row:",
    "  same letter: D[i-1][j-1]",
    "  else 1 + min(diagonal, up, left)",
    "    (replace, delete, insert)",
    "walk back from the corner,",
    "  the way each value came",
  ],
  lcs: [
    "L[i][0] = L[0][j] = 0",
    "for each cell, row by row:",
    "  same letter: L[i-1][j-1] + 1",
    "  else max(up, left)",
    "walk back from the corner:",
    "  a match: keep it, go diagonally",
    "  else toward the bigger value",
  ],
  knapsack: [
    "K[0][w] = 0: no items, no value",
    "for each item i, each room w:",
    "  leave it: K[i-1][w]",
    "  fits? take: K[i-1][w-wᵢ] + vᵢ",
    "  K[i][w] = the better of the two",
    "walk back from the corner:",
    "  changed from above? i was taken",
  ],
};
