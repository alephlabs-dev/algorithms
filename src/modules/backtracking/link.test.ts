import { describe, expect, it } from "vitest";
import { engines, type SliceStates } from "@/modules/engine";
import { EXAMPLE_SPEED, defaultsOf, openLink, reopened, stateFor, within } from "@/modules/testing";
import { routePath } from "@/routes";
import { readLocation } from "@/urlState";
import { backtrackingLink } from "./link";
import { backtrackingManifest } from "./manifest";

describe("backtracking's link", () => {
  it("opens its example link with every setting the link carries", () => {
    expect(backtrackingManifest.example.search).toBe(
      backtrackingLink.write({ n: 5, puzzle: "easy", order: "rows" }, EXAMPLE_SPEED),
    );
    expect(stateFor("backtracking", "single", false).backtracking).toMatchObject({
      problem: "queens",
      queensN: 5,
      sudokuPuzzle: "easy",
      sudokuOrder: "rows",
    });
  });

  it("puts every setting it shares in its link, so editing it changes the link", () => {
    const state = stateFor("backtracking", "single", false);
    expect(engines.backtracking.search(within("backtracking", { queensN: 8 })(state))).not.toBe(
      engines.backtracking.search(state),
    );
  });

  it("puts the Sudoku puzzle in its link", () => {
    const sudokuWith = (change: Partial<SliceStates["backtracking"]>) =>
      within("backtracking", { problem: "sudoku", ...change })(stateFor("backtracking", "single", false));
    const sudoku = sudokuWith({});
    const route = engines.backtracking.route(sudoku);
    expect(routePath(route)).toBe("/backtracking/sudoku");
    const hard = engines.backtracking.search(sudokuWith({ sudokuPuzzle: "hard" }));
    expect(hard).not.toBe(engines.backtracking.search(sudoku));
    expect(readLocation(routePath(route), hard).link.params).toEqual({ puzzle: "hard" });
    const mrv = engines.backtracking.search(sudokuWith({ sudokuOrder: "mrv" }));
    expect(readLocation(routePath(route), mrv).link.params).toEqual({ puzzle: "easy", order: "mrv" });
  });

  describe("url state", () => {
    it("round-trips an N-Queens board size, and ignores sizes out of range", () => {
      const query = backtrackingLink.write({ n: 7 }, "2x");
      expect(readLocation("/backtracking/n-queens", query)).toMatchObject({
        module: "backtracking",
        isModuleStart: false,
        speed: "2x",
        link: { algorithm: "queens", params: { n: 7 } },
      });
      expect(readLocation("/backtracking", "").isModuleStart).toBe(true);
      expect(readLocation("/backtracking/n-queens", "?n=3").link.params).toEqual({});
      expect(readLocation("/backtracking/n-queens", "?n=9").link.params).toEqual({});
    });

    it("round-trips a Sudoku puzzle, and ignores puzzles it doesn't have", () => {
      const query = backtrackingLink.write({ puzzle: "hard" }, "1x");
      expect(readLocation("/es/backtracking/sudoku", query)).toMatchObject({
        module: "backtracking",
        link: { algorithm: "sudoku", params: { puzzle: "hard" } },
      });
      expect(readLocation("/backtracking/sudoku", "?puzzle=evil").link.params).toEqual({});
    });

    it("round-trips the fill order, and ignores orders it doesn't have", () => {
      const query = backtrackingLink.write({ puzzle: "hard", order: "mrv" }, "1x");
      expect(readLocation("/backtracking/sudoku", query).link.params).toEqual({ puzzle: "hard", order: "mrv" });
      // Row by row is the default and stays out of the link.
      expect(backtrackingLink.write({ puzzle: "hard", order: "rows" }, "1x")).toBe("?puzzle=hard");
      expect(readLocation("/backtracking/sudoku", "?order=random").link.params).toEqual({});
    });
  });
});

describe("backtracking's captured links", () => {
  // Full links as the app wrote them before the link codecs moved into the modules (#128), opened on a
  // phone held upright: old shared links keep opening the same run.
  const links: [path: string, query: string][] = [
    ["/backtracking/n-queens", "?n=7&speed=2x"],
    ["/backtracking/sudoku", "?puzzle=hard&order=mrv"],
    // Row by row is the default and stays out of the link.
    ["/backtracking/sudoku", "?puzzle=hard"],
  ];

  it("round-trips a full link of every page kind it writes", () => {
    for (const [path, query] of links) expect(reopened(path, query), path + query).toBe(query);
  });

  it("falls back to the defaults on values it doesn't have", () => {
    const d = defaultsOf("/backtracking/n-queens").backtracking;
    expect(openLink("/backtracking/n-queens", "?n=3").backtracking.queensN).toBe(d.queensN);
    expect(openLink("/backtracking/n-queens", "?n=9").backtracking.queensN).toBe(d.queensN);
    expect(openLink("/backtracking/sudoku", "?puzzle=evil&order=random").backtracking).toMatchObject({
      sudokuPuzzle: d.sudokuPuzzle,
      sudokuOrder: "rows",
    });
  });
});
