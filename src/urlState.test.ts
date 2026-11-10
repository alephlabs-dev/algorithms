import { describe, expect, it } from "vitest";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the example links come from the manifests.
import { backtrackingLink } from "./modules/backtracking/link";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the example links come from the manifests.
import { dpLink } from "./modules/dp/link";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the example links come from the manifests.
import { fourierLink } from "./modules/fourier/link";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the example links come from the manifests.
import { graphsLink } from "./modules/graphs/link";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the example links come from the manifests.
import { pathfindingLink } from "./modules/pathfinding/link";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the example links come from the manifests.
import { sortingLink } from "./modules/sorting/link";
import { routePath } from "./routes";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the example links come from the manifests.
import type { GraphAlgorithm } from "./modules/graphs/types";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the example links come from the manifests.
import type { PathAlgorithm } from "./modules/pathfinding/types";
import { readLocation } from "./urlState";

describe("url state", () => {
  const sorting = {
    size: 100,
    inputOrder: "reversed",
    displayMode: "bars",
    seed: 123456789,
    racers: ["shell", "quick", "heap"],
  } as const;
  const search = sortingLink.write({ ...sorting, racers: [...sorting.racers] }, "2x");

  it("round-trips through the path and query string", () => {
    expect(readLocation(routePath({ module: "sorting", page: "algorithm", algorithm: "heap" }), search)).toEqual({
      isLanding: false,
      isModuleStart: false,
      module: "sorting",
      view: "single",
      speed: "2x",
      link: { algorithm: "heap", params: sorting },
    });
    // The race page has no algorithm of its own.
    expect(readLocation(routePath({ module: "sorting", page: "race" }), search)).toEqual({
      isLanding: false,
      isModuleStart: false,
      module: "sorting",
      view: "race",
      speed: "2x",
      link: { params: sorting },
    });
  });

  it("treats / as the landing page unless an old link picked an algorithm", () => {
    expect(readLocation("/", "").isLanding).toBe(true);
    expect(readLocation("/", "?algo=quick")).toMatchObject({ link: { algorithm: "quick" }, isLanding: false });
  });

  it("opens each module's own page at its start", () => {
    expect(readLocation("/sorting", "")).toMatchObject({ isLanding: false, isModuleStart: true, module: "sorting" });
    expect(readLocation("/pathfinding", "")).toMatchObject({ isLanding: false, isModuleStart: true, module: "pathfinding" });
    expect(readLocation("/pathfinding/dijkstra", "").isModuleStart).toBe(false);
  });

  it("lets the path win over legacy query parameters", () => {
    expect(readLocation("/sorting/merge-sort", "?algo=quick&view=race")).toMatchObject({
      link: { algorithm: "merge" },
      view: "single",
    });
  });

  it("ignores unknown or malformed values", () => {
    const location = readLocation("/sorting", "?algo=bogo&size=37&input=shuffled&mode=dots&speed=4&seed=-1&view=grid&race=quick");
    expect(location.link).toEqual({ params: {} });
    expect(location.speed).toBeUndefined();
    expect(location.view).toBeUndefined();
  });

  it("moves links with a dropped speed preset to the nearest kept one", () => {
    const speed = (query: string) => readLocation("/sorting", query).speed;
    expect(speed("?speed=0.25x")).toBe("0.5x");
    expect(speed("?speed=16x")).toBe("8x");
    expect(speed("?speed=max")).toBe("8x");
    expect(speed("?speed=4x")).toBe("4x");
  });

  it("ignores a speed that was never a preset", () => {
    const speed = (query: string) => readLocation("/sorting", query).speed;
    expect(speed("?speed=3x")).toBeUndefined();
    expect(speed("?speed=constructor")).toBeUndefined();
    expect(speed("?speed=toString")).toBeUndefined();
  });

  it("keeps the valid values when some are wrong", () => {
    expect(readLocation("/sorting", "?algo=quick&size=abc").link).toEqual({ algorithm: "quick", params: {} });
  });

  it("round-trips a pathfinding grid", () => {
    const grid = {
      gridSize: "medium" as const,
      cells: "AbC-_9",
      start: 400,
      end: 12,
      racers: ["bfs", "astar", "greedy"] as PathAlgorithm[],
    };
    const query = pathfindingLink.write(grid, "1x");
    expect(readLocation(routePath({ module: "pathfinding", page: "algorithm", algorithm: "astar" }), query)).toMatchObject({
      module: "pathfinding",
      view: "single",
      link: { algorithm: "astar", params: grid },
    });
    expect(readLocation(routePath({ module: "pathfinding", page: "race" }), query)).toMatchObject({
      module: "pathfinding",
      view: "race",
      link: { params: grid },
    });
  });

  it("round-trips a graph page", () => {
    const graph = {
      graph: "AQEC_-9",
      size: "large" as const,
      preset: "tree" as const,
      racers: ["dfs", "kruskal"] as GraphAlgorithm[],
    };
    const query = graphsLink.write(graph, "1x");
    expect(readLocation(routePath({ module: "graphs", page: "algorithm", algorithm: "dfs" }), query)).toMatchObject({
      module: "graphs",
      link: { algorithm: "dfs", params: graph },
    });
    expect(readLocation("/graphs", "").isModuleStart).toBe(true);
  });

  it("round-trips a Fourier page, with a hand-drawn shape", () => {
    const query = fourierLink.write({ circles: 25, shape: "custom", path: "AbC-_" }, "2x");
    expect(readLocation(routePath({ module: "fourier", page: "algorithm", algorithm: "epicycles" }), query)).toMatchObject({
      module: "fourier",
      speed: "2x",
      link: { algorithm: "epicycles", params: { circles: 25, shape: "custom", path: "AbC-_" } },
    });
    expect(readLocation("/fourier/square-wave", "?circles=999").link.params).toEqual({});
  });

  it("keeps pathfinding racers valid and in order", () => {
    const at = (race: string) => (readLocation("/pathfinding/race", `?race=${race}`).link.params as { racers?: string[] }).racers;
    expect(at("greedy,bfs,greedy")).toEqual(["bfs", "greedy"]);
    expect(at("astar")).toBeUndefined();
    expect(at("quick,merge")).toBeUndefined();
  });

  it("round-trips dynamic programming words with Ñ and accents through the link", () => {
    const words = (query: string) => readLocation("/dynamic-programming/edit-distance", query).link.params as { a?: string; b?: string };
    expect(words(dpLink.write({ a: "AÑO", b: "CAÑÓN" }, "1x"))).toMatchObject({ a: "AÑO", b: "CAÑÓN" });
    expect(words("?a=a%C3%B1o")).toMatchObject({ a: "AÑO" });
    expect(words("?a=A1").a).toBeUndefined();
  });

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

  it("only lets the open module read the query", () => {
    expect(readLocation("/pathfinding/dijkstra", "?size=10&seed=1&circles=25").link.params).toEqual({});
  });
});
