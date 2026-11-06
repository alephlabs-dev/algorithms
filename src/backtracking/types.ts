/**
 * Backtracking: fill a problem's slots one by one (a queen per row), trying
 * each value in turn. A value that breaks a rule is a conflict and is skipped;
 * a slot with no value left is a dead end, so the last choice is taken
 * back and the next value is tried there.
 */

export type BacktrackingProblem = "queens" | "sudoku";

export const MIN_QUEENS = 4;
export const MAX_QUEENS = 8;
export const DEFAULT_QUEENS = 6;

export type Square = { row: number; col: number };

export type QueensEvent =
  | { type: "start" }
  /** A queen placed at (row, col): no queen above attacks it. */
  | { type: "choice"; row: number; col: number }
  /** (row, col) is attacked by the queen at `by`, so it's skipped. */
  | { type: "conflict"; row: number; col: number; by: Square }
  /** No column is left in `row`. */
  | { type: "deadEnd"; row: number }
  /** The queen at (row, col) is taken back, so the next column can be tried there. */
  | { type: "backtrack"; row: number; col: number }
  /** Every row has a queen. */
  | { type: "done" };

export type QueensFrame = {
  event: QueensEvent;
  /** The column of each placed queen, from the top row down. */
  queens: number[];
  choices: number;
  conflicts: number;
  backtracks: number;
  line: number | null;
};

/** Sudoku's preset puzzles. */
export type SudokuPuzzle = "easy" | "hard";

/** Which rule a digit breaks: it's already in the cell's row, column or 3×3 box. */
export type SudokuRule = "row" | "column" | "box";

export type SudokuEvent =
  | { type: "start" }
  /** `digit` placed at (row, col): no row, column or box has it yet. */
  | { type: "choice"; row: number; col: number; digit: number }
  /** `digit` is already at `by`, in the same `rule`, so it's skipped. */
  | { type: "conflict"; row: number; col: number; digit: number; by: Square; rule: SudokuRule }
  /** No digit is left to try at (row, col). */
  | { type: "deadEnd"; row: number; col: number }
  /** `digit` is taken back from (row, col), so the next digit can be tried there. */
  | { type: "backtrack"; row: number; col: number; digit: number }
  /** Every cell is filled. */
  | { type: "done" };

export type SudokuFrame = {
  event: SudokuEvent;
  /** The 81 cells, row by row: a digit, or 0 for empty. Givens included. */
  grid: number[];
  /** The choices that stand, oldest first, as cell indexes. */
  stack: number[];
  choices: number;
  conflicts: number;
  backtracks: number;
  line: number | null;
};

/** The kinds of step every problem records: the same for queens and digits. */
export type BacktrackingEventType = QueensEvent["type"] & SudokuEvent["type"];

/** What playback, the counters and the code card need from any problem's run. */
export type BacktrackingRun = {
  readonly length: number;
  frameAt(index: number): {
    event: { type: BacktrackingEventType };
    line: number | null;
    choices: number;
    conflicts: number;
    backtracks: number;
  };
};
