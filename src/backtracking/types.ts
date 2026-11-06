/**
 * Backtracking: fill a problem's slots one by one (a queen per row), trying
 * each value in turn. A value that breaks a rule is a conflict and is skipped;
 * a slot with no value left is a dead end, so the last choice is undone and
 * the next value is tried there.
 */

export type BacktrackingProblem = "queens";

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
