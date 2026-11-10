import type { QueensRun } from "./queens";
import type { SudokuRun } from "./sudoku";
import type { BacktrackingProblem, BacktrackingRun } from "./types";

/** The run of the problem on stage. */
export const runOf = (s: {
  problem: BacktrackingProblem;
  queensRun: QueensRun;
  sudokuRun: SudokuRun;
}): BacktrackingRun => (s.problem === "sudoku" ? s.sudokuRun : s.queensRun);
