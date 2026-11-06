import type { FillOrder } from "./types";

// Line numbers are QUEENS_LINE in queens.ts.
export const queensPseudocode = [
  "solve(row):",
  "  if row == N: return true",
  "  for col in 0..N-1:",
  "    if safe(row, col):",
  "      place(row, col)",
  "      if solve(row + 1): return true",
  "      remove(row, col)",
  "  return false",
];

// Line numbers are SUDOKU_LINE in sudoku.ts. The same shape as the queens, one cell at a time.
export const sudokuPseudocode = [
  "solve():",
  "  cell = next empty cell",
  "  if none: return true",
  "  for d in 1..9:",
  "    if fits(cell, d):",
  "      place(cell, d)",
  "      if solve(): return true",
  "      remove(cell, d)",
  "  return false",
];

// Fewest options first changes only how the cell is picked.
const fewestOptionsPseudocode = sudokuPseudocode.map((line, k) =>
  k === 1 ? "  cell = cell with fewest options" : line,
);

/** Sudoku's pseudocode for a fill order. The same array every time, so the code card can select it. */
export const sudokuPseudocodeFor = (order: FillOrder) =>
  order === "mrv" ? fewestOptionsPseudocode : sudokuPseudocode;
