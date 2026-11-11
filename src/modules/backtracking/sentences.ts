// Step sentences of representative runs, for e2e/step-sentences-fit.spec.ts (see `sentences` in ../slice.ts).
import { narrateBacktracking, narrateSudoku } from "./narrate";
import { QueensRun } from "./queens";
import { SUDOKU_PUZZLES, SudokuRun } from "./sudoku";
import { MAX_QUEENS, MIN_QUEENS, type FillOrder, type SudokuPuzzle } from "./types";
import type { StepSentence } from "@/modules/slice";

export const sentences = function* (): Generator<StepSentence> {
  for (let n = MIN_QUEENS; n <= MAX_QUEENS; n++) {
    const queens = new QueensRun(n);
    for (let i = 0; i < queens.length; i++) yield { run: `backtracking queens ${n}`, sentence: narrateBacktracking(queens, i) };
  }
  for (const puzzle of Object.keys(SUDOKU_PUZZLES) as SudokuPuzzle[])
    for (const order of ['rows', 'mrv'] as FillOrder[]) {
      const sudoku = new SudokuRun(SUDOKU_PUZZLES[puzzle], order);
      for (let i = 0; i < sudoku.frames.length; i++) yield { run: `backtracking sudoku ${puzzle} ${order}`, sentence: narrateSudoku(sudoku, i) };
    }
};
