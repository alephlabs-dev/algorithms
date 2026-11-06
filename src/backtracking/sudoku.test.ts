import { describe, expect, it } from "vitest";
import { SUDOKU_PUZZLES, SudokuRun, sudokuPseudocode, sudokuPseudocodeFor } from ".";

// Wikipedia's Sudoku and its published solution. The module's puzzles are this one with the digits renamed.
const WIKIPEDIA = "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79";
const WIKIPEDIA_SOLVED =
  "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

/** Wikipedia's solution with the digits renamed the way `puzzle` renames Wikipedia's givens. */
const solvedLike = (puzzle: string) => {
  const rename = new Map<string, string>();
  [...WIKIPEDIA].forEach((digit, k) => digit !== "." && rename.set(digit, puzzle[k]));
  return [...WIKIPEDIA_SOLVED].map((digit) => rename.get(digit)).join("");
};

describe("SudokuRun", () => {
  it.each(["easy", "hard"] as const)("solves the %s puzzle", (id) => {
    const puzzle = SUDOKU_PUZZLES[id];
    const run = new SudokuRun(puzzle);
    expect(run.frameAt(run.length).grid.join("")).toBe(solvedLike(puzzle));
  });

  it("names the first clash it finds, row before column before box", () => {
    // Traced by hand on the easy puzzle: its first empty cell is row 0, column 2.
    const run = new SudokuRun(SUDOKU_PUZZLES.easy);
    expect(run.frames.slice(1, 8).map((f) => f.event)).toEqual([
      { type: "conflict", row: 0, col: 2, digit: 1, by: { row: 0, col: 1 }, rule: "row" },
      { type: "conflict", row: 0, col: 2, digit: 2, by: { row: 0, col: 0 }, rule: "row" },
      { type: "conflict", row: 0, col: 2, digit: 3, by: { row: 0, col: 4 }, rule: "row" },
      { type: "conflict", row: 0, col: 2, digit: 4, by: { row: 2, col: 1 }, rule: "box" },
      { type: "conflict", row: 0, col: 2, digit: 5, by: { row: 2, col: 2 }, rule: "column" },
      { type: "conflict", row: 0, col: 2, digit: 6, by: { row: 1, col: 0 }, rule: "box" },
      { type: "choice", row: 0, col: 2, digit: 7 },
    ]);
    expect(run.frames[7]).toMatchObject({ stack: [2], choices: 1, conflicts: 6 });
  });

  it.each(["easy", "hard"] as const)("keeps its counters in step with the board on the %s puzzle", (id) => {
    const run = new SudokuRun(SUDOKU_PUZZLES[id]);
    const givens = run.givens.filter(Boolean).length;
    const seen = { choice: 0, conflict: 0, backtrack: 0 };
    for (let k = 0; k < run.length; k++) {
      const frame = run.frameAt(k);
      const type = frame.event.type;
      if (type === "choice" || type === "conflict" || type === "backtrack") seen[type]++;
      expect([frame.choices, frame.conflicts, frame.backtracks]).toEqual([seen.choice, seen.conflict, seen.backtrack]);
      // Every digit on the board is a given or a choice that stands.
      expect(frame.stack).toHaveLength(frame.choices - frame.backtracks);
      expect(frame.grid.filter((d) => d !== 0)).toHaveLength(givens + frame.stack.length);
    }
  });

  it("matches the step counts the puzzles were picked for", () => {
    // Counted when the puzzles were chosen (#81): easy 435 steps, 16 backtracks; hard 3,167 and 265.
    const easy = new SudokuRun(SUDOKU_PUZZLES.easy);
    const hard = new SudokuRun(SUDOKU_PUZZLES.hard);
    // Steps are the frames between start and done.
    expect([easy.length - 2, easy.frameAt(easy.length).backtracks]).toEqual([435, 16]);
    expect([hard.length - 2, hard.frameAt(hard.length).backtracks]).toEqual([3167, 265]);
  });

  it("lights up the pseudocode line each kind of step runs", () => {
    const run = new SudokuRun(SUDOKU_PUZZLES.easy);
    const lineFor = (type: string) => {
      const frame = run.frames.find((f) => f.event.type === type)!;
      return frame.line === null ? null : sudokuPseudocode[frame.line];
    };
    expect(lineFor("start")).toBeNull();
    expect(lineFor("conflict")).toContain("if fits(cell, d)");
    expect(lineFor("choice")).toContain("place(cell, d)");
    expect(lineFor("backtrack")).toContain("remove(cell, d)");
    expect(lineFor("deadEnd")).toContain("return false");
    expect(lineFor("done")).toContain("if none: return true");
  });

  describe("fewest options first (MRV)", () => {
    /** How many digits fit at `cell` on `grid`, counted here by the rules. */
    const optionsAt = (grid: number[], cell: number) => {
      const row = Math.floor(cell / 9);
      const col = cell % 9;
      let n = 0;
      for (let d = 1; d <= 9; d++) {
        let fits = true;
        for (let k = 0; k < 9; k++) if (grid[row * 9 + k] === d || grid[k * 9 + col] === d) fits = false;
        const top = row - (row % 3);
        const left = col - (col % 3);
        for (let r = top; r < top + 3; r++) for (let c = left; c < left + 3; c++) if (grid[r * 9 + c] === d) fits = false;
        if (fits) n++;
      }
      return n;
    };

    it.each(["easy", "hard"] as const)("solves the %s puzzle the same as row by row", (id) => {
      const puzzle = SUDOKU_PUZZLES[id];
      const run = new SudokuRun(puzzle, "mrv");
      expect(run.frameAt(run.length).grid.join("")).toBe(solvedLike(puzzle));
    });

    it.each(["easy", "hard"] as const)("always fills a cell with the fewest options on the %s puzzle", (id) => {
      const run = new SudokuRun(SUDOKU_PUZZLES[id], "mrv");
      // A cell is picked right after the start and after every choice; its first try names it.
      for (let k = 1; k < run.length; k++) {
        const before = run.frames[k - 1];
        if (before.event.type !== "start" && before.event.type !== "choice") continue;
        const event = run.frames[k].event;
        if (event.type === "done" || event.type === "start") continue;
        const empty = before.grid.flatMap((digit, cell) => (digit === 0 ? [cell] : []));
        const fewest = Math.min(...empty.map((cell) => optionsAt(before.grid, cell)));
        const first = empty.find((cell) => optionsAt(before.grid, cell) === fewest);
        expect(event.row * 9 + event.col).toBe(first);
      }
    });

    it("says how it picks the cell, and lights up the same lines as row by row", () => {
      const lines = sudokuPseudocodeFor("mrv");
      expect(lines[1]).toContain("cell = cell with fewest options");
      const run = new SudokuRun(SUDOKU_PUZZLES.hard, "mrv");
      const lineFor = (type: string) => lines[run.frames.find((f) => f.event.type === type)!.line!];
      expect(lineFor("conflict")).toContain("if fits(cell, d)");
      expect(lineFor("choice")).toContain("place(cell, d)");
      expect(lineFor("done")).toContain("if none: return true");
      expect(sudokuPseudocodeFor("rows")).toEqual(sudokuPseudocode);
    });

    it("takes far fewer steps, and no backtracks, on both puzzles", () => {
      // Counted with a separate script when #87 was specified.
      const easy = new SudokuRun(SUDOKU_PUZZLES.easy, "mrv");
      const hard = new SudokuRun(SUDOKU_PUZZLES.hard, "mrv");
      expect([easy.length - 2, easy.frameAt(easy.length).backtracks]).toEqual([259, 0]);
      expect([hard.length - 2, hard.frameAt(hard.length).backtracks]).toEqual([252, 0]);
    });
  });
});
