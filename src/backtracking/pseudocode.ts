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
