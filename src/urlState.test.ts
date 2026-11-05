import { describe, expect, it } from "vitest";
import { routePath } from "./routes";
import type { GraphAlgorithm } from "./graphs/types";
import type { PathAlgorithm } from "./pathfinding/types";
import { readLocation, readUrlState, toFourierSearch, toGraphSearch, toPathSearch, toSearch, type UrlState } from "./urlState";

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
      isLanding: false,
      isModuleStart: false,
      module: "sorting",
      path: {},
      graph: {},
      fourier: {},
      structure: {},
      dp: {},
    });
    // The race page has no algorithm of its own (toEqual ignores undefined keys).
    expect(readLocation(routePath({ kind: "race" }), toSearch(state))).toEqual({
      ...state,
      algorithm: undefined,
      isLanding: false,
      isModuleStart: false,
      module: "sorting",
      path: {},
      graph: {},
      fourier: {},
      structure: {},
      dp: {},
    });
  });

  it("treats / as the landing page unless an old link picked an algorithm", () => {
    expect(readLocation("/", "").isLanding).toBe(true);
    expect(readLocation("/", "?algo=quick")).toMatchObject({ algorithm: "quick", isLanding: false });
  });

  it("opens each module's own page at its start", () => {
    expect(readLocation("/sorting", "")).toMatchObject({ isLanding: false, isModuleStart: true, module: "sorting" });
    expect(readLocation("/pathfinding", "")).toMatchObject({ isLanding: false, isModuleStart: true, module: "pathfinding" });
    expect(readLocation("/pathfinding/dijkstra", "").isModuleStart).toBe(false);
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
    const grid = {
      gridSize: "medium" as const,
      cells: "AbC-_9",
      start: 400,
      end: 12,
      racers: ["bfs", "astar", "greedy"] as PathAlgorithm[],
    };
    expect(readLocation(routePath({ kind: "path", algorithm: "astar" }), toPathSearch(grid))).toMatchObject({
      pathAlgorithm: "astar",
      module: "pathfinding",
      view: "single",
      path: grid,
    });
    expect(readLocation(routePath({ kind: "pathRace" }), toPathSearch(grid))).toMatchObject({
      module: "pathfinding",
      view: "race",
      path: grid,
    });
  });

  it("round-trips a graph page", () => {
    const graph = {
      graph: "AQEC_-9",
      size: "large" as const,
      preset: "tree" as const,
      racers: ["dfs", "kruskal"] as GraphAlgorithm[],
    };
    expect(readLocation(routePath({ kind: "graph", algorithm: "dfs" }), toGraphSearch(graph))).toMatchObject({
      module: "graphs",
      graphAlgorithm: "dfs",
      graph,
    });
    expect(readLocation("/graphs", "").isModuleStart).toBe(true);
  });

  it("round-trips a Fourier page, with a hand-drawn shape", () => {
    const search = toFourierSearch({ circles: 25, shape: "custom", path: "AbC-_", speed: "2x" });
    expect(readLocation(routePath({ kind: "series", algorithm: "epicycles" }), search)).toMatchObject({
      module: "fourier",
      fourierAlgorithm: "epicycles",
      speed: "2x",
      fourier: { circles: 25, shape: "custom", path: "AbC-_" },
    });
    expect(readLocation("/fourier/square-wave", "?circles=999").fourier).toEqual({});
  });

  it("keeps pathfinding racers valid and in order", () => {
    const at = (race: string) => readLocation("/pathfinding/race", `?race=${race}`).path.racers;
    expect(at("greedy,bfs,greedy")).toEqual(["bfs", "greedy"]);
    expect(at("astar")).toBeUndefined();
    expect(at("quick,merge")).toBeUndefined();
  });
});
