import type { QueensRun } from "./queens";
import type { SudokuRun } from "./sudoku";
import type { BacktrackingProblem, BacktrackingRun } from "./types";

/** The run of the problem on stage. */
export const runOf = (s: {
  backtrackingProblem: BacktrackingProblem;
  queensRun: QueensRun;
  sudokuRun: SudokuRun;
}): BacktrackingRun => (s.backtrackingProblem === "sudoku" ? s.sudokuRun : s.queensRun);
