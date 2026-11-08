import { describe, expect, it } from "vitest";
import { sortAlgorithms } from "@/algorithms";
import { Timeline } from "@/algorithms/timeline";
import { createAppStore, type StoreState, type View } from "@/appStore";
import { encodeItems } from "@/dp/presets";
import { encodePath, linkShape } from "@/fourier/shapes";
import { makeGraph } from "@/graphs";
import { encodeGraph } from "@/graphs/graph";
import { applyPreset, emptyGrid } from "@/pathfinding";
import { encodeCells } from "@/pathfinding/grid";
import { moduleOf, routeFromPath, routePath, type Route } from "@/routes";
import { encodeOperations } from "@/structures/link";
import {
  readLocation,
  toBacktrackingSearch,
  toDpSearch,
  toFourierSearch,
  toGraphSearch,
  toPathSearch,
  toSearch,
  toStructureSearch,
} from "@/urlState";
import { generateItems } from "@/utils/generateItems";
import { seededRandom } from "@/utils/random";
import { engines, type ModuleId, type SliceStates } from "./engine";

const SPEED = "2x";

// Each module opens on a link to one of its pages, carrying settings that differ from its defaults.
const maze = applyPreset(emptyGrid(17, 33), "maze", seededRandom(3));
const LINKS: Record<ModuleId, { page: Route; search: string }> = {
  sorting: {
    page: { kind: "algorithm", algorithm: "heap" },
    search: toSearch({
      size: 40,
      inputOrder: "reversed",
      displayMode: "bars",
      seed: 12345,
      raceAlgorithms: ["insertion", "quick", "merge"],
      speed: SPEED,
    }),
  },
  pathfinding: {
    page: { kind: "path", algorithm: "dijkstra" },
    search: toPathSearch({
      gridSize: "medium",
      cells: encodeCells(maze.cells),
      start: maze.start,
      end: maze.end,
      racers: ["bfs", "astar"],
      speed: SPEED,
    }),
  },
  graphs: {
    page: { kind: "graph", algorithm: "dijkstra" },
    search: toGraphSearch({
      graph: encodeGraph(makeGraph("tree", "large", false, seededRandom(5))),
      size: "large",
      preset: "tree",
      racers: ["prim", "kruskal"],
      speed: SPEED,
    }),
  },
  dp: {
    page: { kind: "dpProblem", algorithm: "lcs" },
    search: toDpSearch({
      a: "KITTEN",
      b: "SITTING",
      items: encodeItems([
        { weight: 3, value: 4 },
        { weight: 4, value: 5 },
      ]),
      capacity: 7,
      speed: SPEED,
    }),
  },
  structures: {
    page: { kind: "structure", algorithm: "avl" },
    search: toStructureSearch({
      ops: encodeOperations([
        { kind: "insert", value: 10 },
        { kind: "insert", value: 20 },
      ]),
      size: "medium",
      preset: "ascending",
      speed: SPEED,
    }),
  },
  backtracking: {
    page: { kind: "backtrackingProblem", algorithm: "queens" },
    search: toBacktrackingSearch({ n: 5, puzzle: "easy", order: "rows", speed: SPEED }),
  },
  fourier: {
    page: { kind: "series", algorithm: "epicycles" },
    search: toFourierSearch({
      circles: 25,
      shape: "custom",
      // A drawing travels in its link as the slice keeps it: fitted by linkShape.
      path: encodePath(
        linkShape([
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
        ]),
      ),
      speed: SPEED,
    }),
  },
};

/** The store opened on the module's link, then switched to `view` the way the app does. */
const stateFor = (module: ModuleId, view: View, isModuleStart: boolean): StoreState => {
  const { page, search } = LINKS[module];
  const store = createAppStore({
    url: readLocation(routePath(page), search),
    isMobile: false,
    isPortrait: false,
    theme: "dark",
  });
  if (view === "race") store.getState().setView("race");
  // Switching view leaves the module's start page, so the start page is set afterwards.
  return { ...store.getState(), isModuleStart };
};

/** A change to one module's slice. */
const within =
  <M extends ModuleId>(module: M, change: Partial<SliceStates[M]>) =>
  (state: StoreState): StoreState => ({ ...state, [module]: { ...state[module], ...change } });

describe("module engines", () => {
  for (const module of Object.keys(engines) as ModuleId[]) {
    it(`${module}: every page it can be on belongs to it and survives its URL`, () => {
      for (const view of ["single", "race"] as const) {
        for (const isModuleStart of [false, true]) {
          const state = stateFor(module, view, isModuleStart);
          const route = engines[module].route(state);
          const path = routePath(route);
          expect(moduleOf(route)).toBe(module);
          expect(routeFromPath(path)).toEqual(route);
          const location = readLocation(path, engines[module].search(state));
          expect(location.module).toBe(module);
          // Fourier and backtracking have no race: their pages are single view whatever the store's view says.
          const hasRace = module !== "fourier" && module !== "backtracking";
          expect(location.view ?? "single").toBe(hasRace ? view : "single");
          expect(location.speed).toBe(SPEED);
        }
      }
    });
  }

  it("puts every setting a module shares in its link, so editing it changes the link", () => {
    const changes: [ModuleId, (state: StoreState) => StoreState][] = [
      ["sorting", within("sorting", { size: 80 })],
      ["sorting", within("sorting", { inputOrder: "sorted" })],
      ["sorting", within("sorting", { seed: 99 })],
      ["sorting", within("sorting", { racers: ["quick", "merge"] })],
      [
        "pathfinding",
        within("pathfinding", { grid: applyPreset(emptyGrid(17, 33), "walls", seededRandom(8)) }),
      ],
      ["pathfinding", within("pathfinding", { racers: ["dfs", "greedy"] })],
      ["graphs", within("graphs", { graph: makeGraph("grid", "large", false, seededRandom(2)) })],
      ["graphs", within("graphs", { preset: "dag" })],
      ["graphs", within("graphs", { racers: ["bfs", "topo"] })],
      ["fourier", within("fourier", { circles: 100 })],
      ["fourier", within("fourier", { shape: "star" })],
      [
        "fourier",
        within("fourier", {
          path: linkShape([
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
          ]),
        }),
      ],
      ["fourier", (state) => ({ ...state, speedPreset: "4x" })],
      [
        "structures",
        within("structures", {
          ops: [
            { kind: "insert", value: 10 },
            { kind: "delete", value: 10 },
          ],
        }),
      ],
      ["structures", within("structures", { preset: "random" })],
      ["dp", within("dp", { a: "SUNDAY" })],
      ["dp", within("dp", { b: "SATURDAY" })],
      ["dp", within("dp", { algorithm: "knapsack", capacity: 9 })],
      ["backtracking", within("backtracking", { queensN: 8 })],
    ];
    for (const [module, change] of changes) {
      const state = stateFor(module, "single", false);
      expect(engines[module].search(change(state))).not.toBe(engines[module].search(state));
    }
  });

  it("puts the Sudoku puzzle in its link", () => {
    const sudokuWith = (change: Partial<SliceStates["backtracking"]>) =>
      within("backtracking", { problem: "sudoku", ...change })(stateFor("backtracking", "single", false));
    const sudoku = sudokuWith({});
    const route = engines.backtracking.route(sudoku);
    expect(routePath(route)).toBe("/backtracking/sudoku");
    const hard = engines.backtracking.search(sudokuWith({ sudokuPuzzle: "hard" }));
    expect(hard).not.toBe(engines.backtracking.search(sudoku));
    expect(readLocation(routePath(route), hard).backtracking).toEqual({ puzzle: "hard" });
    const mrv = engines.backtracking.search(sudokuWith({ sudokuOrder: "mrv" }));
    expect(readLocation(routePath(route), mrv).backtracking).toEqual({ puzzle: "easy", order: "mrv" });
  });

  it("sorting has guess mode with 10 or 20 items, and none with more", () => {
    const sortingWith = (size: number) =>
      within("sorting", {
        algorithm: "insertion",
        size,
        run: new Timeline(sortAlgorithms.insertion, generateItems(size, "random", seededRandom(4))),
      })(stateFor("sorting", "single", false));
    const game = engines.sorting.game;
    expect(game).toBeDefined();
    expect(game!(sortingWith(10)).length).toBeGreaterThan(0);
    expect(game!(sortingWith(20)).length).toBeGreaterThan(0);
    expect(game!(sortingWith(40))).toEqual([]);
    expect(game!(sortingWith(400))).toEqual([]);
  });
});
