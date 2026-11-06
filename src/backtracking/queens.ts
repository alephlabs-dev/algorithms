import type { QueensEvent, QueensFrame, Square } from "./types";

// Pseudocode lines (see pseudocode.ts).
export const QUEENS_LINE = {
  solved: 1,
  safe: 3,
  place: 4,
  remove: 6,
  deadEnd: 7,
} as const;

const lineOf: Record<QueensEvent["type"], number | null> = {
  start: null,
  choice: QUEENS_LINE.place,
  conflict: QUEENS_LINE.safe,
  deadEnd: QUEENS_LINE.deadEnd,
  backtrack: QUEENS_LINE.remove,
  done: QUEENS_LINE.solved,
};

/** Whether a queen at `queen` attacks `square`: same column, or on a diagonal. Rows are one queen each. */
export const attacks = (queen: Square, square: Square) =>
  queen.row !== square.row &&
  (queen.col === square.col || Math.abs(queen.col - square.col) === Math.abs(queen.row - square.row));

/** The queen above (row, col) that attacks it, the topmost one first; null when it's safe. */
export const attacker = (queens: number[], row: number, col: number): Square | null => {
  for (let r = 0; r < row; r++) if (attacks({ row: r, col: queens[r] }, { row, col })) return { row: r, col: queens[r] };
  return null;
};

/**
 * Places n queens on an n×n board, one per row, so no two attack each other.
 * Tries each column of a row from the left and stops at the first solution,
 * recording a frame per choice, conflict, dead end and backtrack.
 */
export class QueensRun {
  readonly frames: QueensFrame[] = [];
  readonly solution: number[];

  constructor(readonly n: number) {
    const queens: number[] = [];
    let choices = 0;
    let conflicts = 0;
    let backtracks = 0;
    const frame = (event: QueensEvent) =>
      this.frames.push({ event, queens: queens.slice(), choices, conflicts, backtracks, line: lineOf[event.type] });

    frame({ type: "start" });
    const solve = (row: number): boolean => {
      if (row === n) return true;
      for (let col = 0; col < n; col++) {
        const by = attacker(queens, row, col);
        if (by) {
          conflicts++;
          frame({ type: "conflict", row, col, by });
          continue;
        }
        queens.push(col);
        choices++;
        frame({ type: "choice", row, col });
        if (solve(row + 1)) return true;
        queens.pop();
        backtracks++;
        frame({ type: "backtrack", row, col });
      }
      frame({ type: "deadEnd", row });
      return false;
    };
    solve(0);
    this.solution = queens.slice();
    frame({ type: "done" });
  }

  get length() {
    return this.frames.length;
  }

  /** Frame `index`, or the last one past the end. */
  frameAt(index: number): QueensFrame {
    return this.frames[Math.min(index, this.frames.length - 1)];
  }
}
