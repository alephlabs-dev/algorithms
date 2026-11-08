import {
  DEFAULT_QUEENS,
  MAX_QUEENS,
  MIN_QUEENS,
  QueensRun,
  runOf,
  SUDOKU_PUZZLES,
  SudokuRun,
  type BacktrackingProblem,
  type FillOrder,
  type SudokuPuzzle,
} from "@/backtracking";
import type { BacktrackingEventType } from "@/backtracking/types";
import { toBacktrackingSearch } from "@/urlState";
import { defineModule } from "./slice";

/** Both problems keep their run, so switching between them doesn't lose either. */
export type BacktrackingState = {
  problem: BacktrackingProblem;
  /** N-Queens: the board's size, and how many queens go on it. */
  queensN: number;
  queensRun: QueensRun;
  /** Sudoku: which preset puzzle, and in what order its cells are filled. */
  sudokuPuzzle: SudokuPuzzle;
  sudokuOrder: FillOrder;
  sudokuRun: SudokuRun;
};

/** Conflicts flick past; a queen or digit placed or taken back gets the full beat, a dead end a longer one. */
const STEP_WEIGHT: Record<BacktrackingEventType, number> = {
  start: 0.7,
  conflict: 0.4,
  choice: 1,
  deadEnd: 1.2,
  backtrack: 1,
  done: 0.5,
};

const sudokuRunOf = (puzzle: SudokuPuzzle, order: FillOrder) => new SudokuRun(SUDOKU_PUZZLES[puzzle], order);

export const backtrackingSlice = defineModule<BacktrackingState, BacktrackingProblem>()({
  tourKey: "tour-done-backtracking",

  hydrate: (link) => {
    const queensN = link.backtracking.n ?? DEFAULT_QUEENS;
    const sudokuPuzzle = link.backtracking.puzzle ?? "easy";
    const sudokuOrder = link.backtracking.order ?? "rows";
    return {
      problem: link.backtrackingProblem ?? "queens",
      queensN,
      queensRun: new QueensRun(queensN),
      sudokuPuzzle,
      sudokuOrder,
      sudokuRun: sudokuRunOf(sudokuPuzzle, sudokuOrder),
    };
  },

  current: (s) => s.problem,

  pick: (s, _, problem) => ({
    problem,
    queensRun: new QueensRun(s.queensN),
    sudokuRun: sudokuRunOf(s.sudokuPuzzle, s.sudokuOrder),
  }),

  actions: {
    setQueensN: (_s, _, queensN: number) => ({ queensN, queensRun: new QueensRun(queensN) }),
    setSudokuPuzzle: (s, _, sudokuPuzzle: SudokuPuzzle) => ({
      sudokuPuzzle,
      sudokuRun: sudokuRunOf(sudokuPuzzle, s.sudokuOrder),
    }),
    setSudokuOrder: (s, _, sudokuOrder: FillOrder) => ({
      sudokuOrder,
      sudokuRun: sudokuRunOf(s.sudokuPuzzle, sudokuOrder),
    }),
  },

  // "New": the next board size (wrapping back to the smallest), or the other puzzle.
  newInput: (s) => {
    if (s.problem === "sudoku") {
      const sudokuPuzzle = s.sudokuPuzzle === "easy" ? "hard" : "easy";
      return { sudokuPuzzle, sudokuRun: sudokuRunOf(sudokuPuzzle, s.sudokuOrder) };
    }
    const queensN = s.queensN >= MAX_QUEENS ? MIN_QUEENS : s.queensN + 1;
    return { queensN, queensRun: new QueensRun(queensN) };
  },

  engine: {
    lastIndex: (s) => runOf(s).length - 1,
    stepWeight: (s, index) => STEP_WEIGHT[runOf(s).frameAt(index).event.type],
    pace: () => "backtracking",
    route: (s, ctx) =>
      ctx.isModuleStart ? { kind: "backtracking" } : { kind: "backtrackingProblem", algorithm: s.problem },
    // N-Queens links its board size; Sudoku its puzzle.
    search: (s, ctx) =>
      toBacktrackingSearch(
        s.problem === "sudoku"
          ? { puzzle: s.sudokuPuzzle, order: s.sudokuOrder, speed: ctx.speedPreset }
          : { n: s.queensN, speed: ctx.speedPreset },
      ),
  },
});
