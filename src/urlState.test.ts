import { describe, expect, it } from "vitest";
import { routePath } from "./routes";
import { readLocation, readUrlState, toPathSearch, toSearch, type UrlState } from "./urlState";

describe("url state", () => {
  const state: UrlState = {
    algorithm: "heap",
    size: 100,
    inputOrder: "reversed",
    displayMode: "bars",
    speed: "2x",
    seed: 123456789,
    view: "race",
    raceAlgorithms: ["shell", "quick", "heap"],
  };

  it("round-trips through the path and query string", () => {
    const single = { ...state, view: "single" as const };
    expect(readLocation(routePath({ kind: "algorithm", algorithm: "heap" }), toSearch(single))).toEqual({
      ...single,
      isHome: false,
      path: {},
    });
    // The race page has no algorithm of its own (toEqual ignores undefined keys).
    expect(readLocation(routePath({ kind: "race" }), toSearch(state))).toEqual({
      ...state,
      algorithm: undefined,
      isHome: false,
      path: {},
    });
  });

  it("treats / as the home page unless an old link picked an algorithm", () => {
    expect(readLocation("/", "").isHome).toBe(true);
    expect(readLocation("/", "?algo=quick")).toMatchObject({ algorithm: "quick", isHome: false });
  });

  it("lets the path win over legacy query parameters", () => {
    expect(readLocation("/sorting/merge-sort", "?algo=quick&view=race")).toMatchObject({
      algorithm: "merge",
      view: "single",
    });
  });

  it("ignores unknown or malformed values", () => {
    expect(
      readUrlState("?algo=bogo&size=37&input=shuffled&mode=dots&speed=4&seed=-1&view=grid&race=quick")
    ).toEqual({});
  });

  it("keeps the valid values when some are wrong", () => {
    expect(readUrlState("?algo=quick&size=abc")).toEqual({ algorithm: "quick" });
  });

  it("round-trips a pathfinding grid", () => {
    const grid = { gridSize: "medium" as const, cells: "AbC-_9", start: 400, end: 12 };
    expect(readLocation(routePath({ kind: "path", algorithm: "astar" }), toPathSearch(grid))).toMatchObject({
      pathAlgorithm: "astar",
      path: grid,
    });
  });
});
