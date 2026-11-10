import { describe, expect, it } from "vitest";
import { QueensRun } from "./queens";
import { queensPseudocode } from "./pseudocode";

describe("QueensRun", () => {
  // The first solution in column order, row by row: the column of each row's queen.
  it.each([
    [4, [1, 3, 0, 2]],
    [5, [0, 2, 4, 1, 3]],
    [6, [1, 3, 5, 0, 2, 4]],
    [7, [0, 2, 4, 6, 1, 3, 5]],
    [8, [0, 4, 7, 5, 2, 6, 1, 3]],
  ])("finds the first solution for %i queens", (n, solution) => {
    expect(new QueensRun(n).solution).toEqual(solution);
  });

  it("counts every choice, conflict, dead end and backtrack on the way to 4 queens", () => {
    // Traced by hand: (0,0) leads nowhere, so the first queen moves to column 1.
    const run = new QueensRun(4);
    const last = run.frames[run.length - 1];
    expect(last).toMatchObject({ choices: 8, conflicts: 18, backtracks: 4, queens: [1, 3, 0, 2] });
    expect(run.frames.filter((f) => f.event.type === "deadEnd").map((f) => f.event)).toEqual([
      { type: "deadEnd", row: 2 },
      { type: "deadEnd", row: 3 },
      { type: "deadEnd", row: 2 },
      { type: "deadEnd", row: 1 },
    ]);
    // The first dead end: row 1 settles on column 2, and row 2 has nowhere left to go.
    expect(run.frames.slice(1, 10).map((f) => f.event)).toEqual([
      { type: "choice", row: 0, col: 0 },
      { type: "conflict", row: 1, col: 0, by: { row: 0, col: 0 } },
      { type: "conflict", row: 1, col: 1, by: { row: 0, col: 0 } },
      { type: "choice", row: 1, col: 2 },
      { type: "conflict", row: 2, col: 0, by: { row: 0, col: 0 } },
      { type: "conflict", row: 2, col: 1, by: { row: 1, col: 2 } },
      { type: "conflict", row: 2, col: 2, by: { row: 0, col: 0 } },
      { type: "conflict", row: 2, col: 3, by: { row: 1, col: 2 } },
      { type: "deadEnd", row: 2 },
    ]);
    expect(run.frames[10]).toMatchObject({ event: { type: "backtrack", row: 1, col: 2 }, queens: [0] });
  });

  it("lights up the pseudocode line each kind of step runs", () => {
    const run = new QueensRun(6);
    const lineFor = (type: string) => {
      const frame = run.frames.find((f) => f.event.type === type)!;
      return frame.line === null ? null : queensPseudocode[frame.line];
    };
    expect(lineFor("start")).toBeNull();
    expect(lineFor("conflict")).toContain("if safe(row, col)");
    expect(lineFor("choice")).toContain("place(row, col)");
    expect(lineFor("backtrack")).toContain("remove(row, col)");
    expect(lineFor("deadEnd")).toContain("return false");
    expect(lineFor("done")).toContain("if row == N: return true");
  });

  it.each([4, 5, 6, 7, 8])("keeps its counters in step with the board for %i queens", (n) => {
    const run = new QueensRun(n);
    const seen = { choice: 0, conflict: 0, backtrack: 0 };
    for (let k = 0; k < run.length; k++) {
      const frame = run.frameAt(k);
      const type = frame.event.type;
      if (type === "choice" || type === "conflict" || type === "backtrack") seen[type]++;
      expect([frame.choices, frame.conflicts, frame.backtracks]).toEqual([seen.choice, seen.conflict, seen.backtrack]);
      // Every queen on the board is a choice that hasn't been taken back.
      expect(frame.queens).toHaveLength(frame.choices - frame.backtracks);
    }
    // Past the end, the last frame: the solution.
    expect(run.frameAt(run.length + 5).queens).toEqual(run.solution);
  });
});
