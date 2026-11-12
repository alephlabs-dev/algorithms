import { DEFAULT_QUEENS, MAX_QUEENS, MIN_QUEENS, type BacktrackingProblem, type FillOrder, type SudokuPuzzle } from "./types";
import { QueensRun } from "./queens";
import { runOf } from "./run";
import { SUDOKU_PUZZLES, SudokuRun } from "./sudoku";
import type { BacktrackingEventType } from "./types";
import { questionsOf } from "@/game";
import { queensQuestions } from "./questions";
import { localized } from "@/i18n";
import { backtrackingLink, type BacktrackingLink } from "./link";
import { defineModule } from "@/modules/slice";
import { sentences } from "./sentences";

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

const guessText = localized({
  en: { queensOnly: "Guess works with N-Queens for now" },
  es: { queensOnly: "Adivina funciona con N reinas por ahora" },
});

const sudokuRunOf = (puzzle: SudokuPuzzle, order: FillOrder) => new SudokuRun(SUDOKU_PUZZLES[puzzle], order);

export const backtrackingSlice = defineModule<BacktrackingState, BacktrackingProblem, BacktrackingLink>()({
  sentences,

  link: backtrackingLink,
  hydrate: (link) => {
    const queensN = link.params.n ?? DEFAULT_QUEENS;
    const sudokuPuzzle = link.params.puzzle ?? "easy";
    const sudokuOrder = link.params.order ?? "rows";
    return {
      problem: link.algorithm ?? "queens",
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
    pace: () => 40,
    // Sudoku asks nothing yet (#143).
    game: (s) => (s.problem === "queens" ? questionsOf(s.queensRun, queensQuestions) : []),
    gameUnavailable: (s) => (s.problem === "queens" ? null : guessText.queensOnly),
    // N-Queens links its board size; Sudoku its puzzle.
    search: (s, ctx) =>
      backtrackingLink.write(
        s.problem === "sudoku"
          ? { puzzle: s.sudokuPuzzle, order: s.sudokuOrder }
          : { n: s.queensN },
        ctx.speedPreset,
      ),
  },
});
