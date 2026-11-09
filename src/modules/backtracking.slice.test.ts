import { describe, expect, it } from "vitest";
import { routePath } from "@/routes";
import { routeIn } from "./engine";
import { readLocation } from "@/urlState";
import { backtrackingSlice as slice, type BacktrackingState } from "./backtracking.slice";
import type { SliceContext } from "./slice";

const ctx: SliceContext = {
  view: "single",
  isModuleStart: false,
  speedPreset: "1x",
  isMobile: false,
  isPortrait: false,
};
const at = (path: string, search = "") => slice.hydrate(readLocation(path, search), ctx);
const apply = (s: BacktrackingState, patch: Partial<BacktrackingState> | null) => ({ ...s, ...patch });
const settings = ({ problem, queensN, sudokuPuzzle, sudokuOrder }: BacktrackingState) => ({
  problem,
  queensN,
  sudokuPuzzle,
  sudokuOrder,
});
const lastIndex = (s: BacktrackingState) => slice.engine.lastIndex(s, "single");

describe("backtracking slice", () => {
  it("opens on six queens, with both problems' runs ready", () => {
    const s = at("/backtracking");
    expect(settings(s)).toEqual({ problem: "queens", queensN: 6, sudokuPuzzle: "easy", sudokuOrder: "rows" });
    expect(s.queensRun.n).toBe(6);
    expect(s.sudokuRun.frames.length).toBeGreaterThan(1);
  });

  it("survives its own link", () => {
    const sudoku = at("/backtracking/sudoku");
    for (const s of [
      apply(at("/backtracking"), slice.actions.setQueensN(at("/backtracking"), ctx, 8)),
      apply(sudoku, slice.actions.setSudokuPuzzle(sudoku, ctx, "hard")),
      apply(sudoku, slice.actions.setSudokuOrder(sudoku, ctx, "mrv")),
    ]) {
      const path = routePath(routeIn("backtracking", slice.current(s), ctx));
      const reopened = at(path, slice.engine.search(s, ctx));
      // The link carries only the problem on stage's settings.
      expect(reopened.problem).toBe(s.problem);
      if (s.problem === "sudoku") {
        expect([reopened.sudokuPuzzle, reopened.sudokuOrder]).toEqual([s.sudokuPuzzle, s.sudokuOrder]);
      } else {
        expect(reopened.queensN).toBe(s.queensN);
      }
    }
  });

  it("the playback length follows the problem on stage", () => {
    const queens = at("/backtracking");
    const sudoku = apply(queens, slice.pick(queens, ctx, "sudoku"));
    expect(lastIndex(queens)).toBe(queens.queensRun.length - 1);
    expect(lastIndex(sudoku)).toBe(sudoku.sudokuRun.length - 1);
    // Switching problem keeps the other one's settings.
    expect(sudoku.queensN).toBe(queens.queensN);
  });

  it("new input steps the board up to the biggest and wraps back; in Sudoku it swaps the puzzle", () => {
    let s = at("/backtracking");
    const sizes = [s.queensN];
    for (let i = 0; i < 5; i++) {
      s = apply(s, slice.newInput(s, ctx));
      sizes.push(s.queensN);
    }
    expect(sizes).toEqual([6, 7, 8, 4, 5, 6]);
    expect(s.queensRun.n).toBe(6);

    const sudoku = at("/backtracking/sudoku");
    const next = apply(sudoku, slice.newInput(sudoku, ctx));
    expect(next.sudokuPuzzle).toBe("hard");
    expect(apply(next, slice.newInput(next, ctx)).sudokuPuzzle).toBe("easy");
  });
});
