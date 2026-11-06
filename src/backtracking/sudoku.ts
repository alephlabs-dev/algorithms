import type { Square, SudokuEvent, SudokuFrame, SudokuPuzzle, SudokuRule } from "./types";

/**
 * Wikipedia's Sudoku with its digits renamed. Renaming changes the order the digits are
 * tried in, and so the length of the search: 435 steps for the easy one, 3,167 for the hard one.
 */
export const SUDOKU_PUZZLES: Record<SudokuPuzzle, string> = {
  easy: "21..3....6..942....45....6.5...6...17..5.1..93...8...6.6....85....794..2....5..34",
  hard: "82..5....7..938....34....7.4...7...21..4.2..95...6...7.7....64....193..8....4..53",
};

// Pseudocode lines (see pseudocode.ts).
export const SUDOKU_LINE = {
  solved: 2,
  fits: 4,
  place: 5,
  remove: 7,
  deadEnd: 8,
} as const;

const lineOf: Record<SudokuEvent["type"], number | null> = {
  start: null,
  choice: SUDOKU_LINE.place,
  conflict: SUDOKU_LINE.fits,
  deadEnd: SUDOKU_LINE.deadEnd,
  backtrack: SUDOKU_LINE.remove,
  done: SUDOKU_LINE.solved,
};

/** Where `digit` already is in the row, column or box of (row, col), checked in that order; null when it fits. */
export const conflictWith = (grid: number[], row: number, col: number, digit: number): { by: Square; rule: SudokuRule } | null => {
  for (let c = 0; c < 9; c++) if (c !== col && grid[row * 9 + c] === digit) return { by: { row, col: c }, rule: "row" };
  for (let r = 0; r < 9; r++) if (r !== row && grid[r * 9 + col] === digit) return { by: { row: r, col }, rule: "column" };
  const top = row - (row % 3);
  const left = col - (col % 3);
  for (let r = top; r < top + 3; r++)
    for (let c = left; c < left + 3; c++)
      if ((r !== row || c !== col) && grid[r * 9 + c] === digit) return { by: { row: r, col: c }, rule: "box" };
  return null;
};

/**
 * Fills a Sudoku's empty cells row by row, trying 1 to 9 in each, and stops
 * at the solution, recording a frame per choice, conflict, dead end and backtrack.
 */
export class SudokuRun {
  readonly frames: SudokuFrame[] = [];
  /** The givens: true where the puzzle has a digit. */
  readonly givens: boolean[];

  constructor(readonly puzzle: string) {
    const grid = [...puzzle].map((ch) => (ch === "." ? 0 : Number(ch)));
    this.givens = grid.map((digit) => digit !== 0);
    const empty = grid.flatMap((digit, k) => (digit === 0 ? [k] : []));
    const stack: number[] = [];
    let choices = 0;
    let conflicts = 0;
    let backtracks = 0;
    const frame = (event: SudokuEvent) =>
      this.frames.push({
        event,
        grid: grid.slice(),
        stack: stack.slice(),
        choices,
        conflicts,
        backtracks,
        line: lineOf[event.type],
      });

    frame({ type: "start" });
    const solve = (k: number): boolean => {
      if (k === empty.length) return true;
      const cell = empty[k];
      const row = Math.floor(cell / 9);
      const col = cell % 9;
      for (let digit = 1; digit <= 9; digit++) {
        const conflict = conflictWith(grid, row, col, digit);
        if (conflict) {
          conflicts++;
          frame({ type: "conflict", row, col, digit, ...conflict });
          continue;
        }
        grid[cell] = digit;
        stack.push(cell);
        choices++;
        frame({ type: "choice", row, col, digit });
        if (solve(k + 1)) return true;
        grid[cell] = 0;
        stack.pop();
        backtracks++;
        frame({ type: "backtrack", row, col, digit });
      }
      frame({ type: "deadEnd", row, col });
      return false;
    };
    solve(0);
    frame({ type: "done" });
  }

  get length() {
    return this.frames.length;
  }

  /** How many cells the puzzle leaves to fill. */
  get emptyCount() {
    return this.givens.filter((given) => !given).length;
  }

  /** Frame `index`, or the last one past the end. */
  frameAt(index: number): SudokuFrame {
    return this.frames[Math.min(index, this.frames.length - 1)];
  }
}
