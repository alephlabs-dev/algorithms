import { describe, expect, it } from "vitest";
import { sortAlgorithms } from "@/algorithms";
import { Timeline } from "@/algorithms/timeline";
import { makeGraph } from "@/graphs";
import { applyPreset, emptyGrid } from "@/pathfinding";
import { moduleOf, routeFromPath, routePath } from "@/routes";
import type { StoreState } from "@/store";
import { readLocation } from "@/urlState";
import { generateItems } from "@/utils/generateItems";
import { seededRandom } from "@/utils/random";
import { engines, type ModuleId } from "./engine";

// Just the fields the engines' routing reads; the store itself needs a browser.
const stateFor = (module: ModuleId, view: "single" | "race", isModuleStart: boolean) =>
  ({
    module,
    view,
    isModuleStart,
    isLanding: false,
    activeAlgorithm: "heap",
    size: 40,
    inputOrder: "reversed",
    displayMode: "bars",
    speedPreset: "2x",
    seed: 12345,
    raceAlgorithms: ["insertion", "quick", "merge"],
    pathAlgorithm: "dijkstra",
    gridSize: "medium",
    grid: applyPreset(emptyGrid(17, 33), "maze", seededRandom(3)),
    pathRaceAlgorithms: ["bfs", "astar"],
    graphAlgorithm: "dijkstra",
    graphSize: "large",
    graphPreset: "tree",
    graph: makeGraph("tree", "large", false, seededRandom(5)),
    graphRaceAlgorithms: ["prim", "kruskal"],
    structureAlgorithm: "avl",
    structureSize: "medium",
    structurePreset: "ascending",
    structureOps: [
      { kind: "insert", value: 10 },
      { kind: "insert", value: 20 },
    ],
    dpAlgorithm: "lcs",
    dpA: "KITTEN",
    dpB: "SITTING",
    dpItems: [
      { weight: 3, value: 4 },
      { weight: 4, value: 5 },
    ],
    dpCapacity: 7,
    fourierAlgorithm: "epicycles",
    fourierCircles: 25,
    fourierShape: "custom",
    fourierPath: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
  }) as unknown as StoreState;

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
          // Fourier has no race: its pages are single view whatever the store's view says.
          expect(location.view ?? "single").toBe(module === "fourier" ? "single" : view);
          expect(location.speed).toBe("2x");
        }
      }
    });
  }

  it("puts every setting a module shares in its link, so editing it changes the link", () => {
    const changes: [ModuleId, Partial<StoreState>][] = [
      ["sorting", { size: 80 }],
      ["sorting", { inputOrder: "sorted" }],
      ["sorting", { seed: 99 }],
      ["sorting", { raceAlgorithms: ["quick", "merge"] }],
      ["pathfinding", { grid: applyPreset(emptyGrid(17, 33), "walls", seededRandom(8)) }],
      ["pathfinding", { pathRaceAlgorithms: ["dfs", "greedy"] }],
      ["graphs", { graph: makeGraph("grid", "large", false, seededRandom(2)) }],
      ["graphs", { graphPreset: "dag" }],
      ["graphs", { graphRaceAlgorithms: ["bfs", "topo"] }],
      ["fourier", { fourierCircles: 100 }],
      ["fourier", { fourierShape: "star" }],
      ["fourier", { fourierPath: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] }],
      ["fourier", { speedPreset: "4x" }],
      ["structures", { structureOps: [{ kind: "insert", value: 10 }, { kind: "delete", value: 10 }] }],
      ["structures", { structurePreset: "random" }],
      ["dp", { dpA: "SUNDAY" }],
      ["dp", { dpB: "SATURDAY" }],
      ["dp", { dpAlgorithm: "knapsack", dpCapacity: 9 }],
    ];
    for (const [module, change] of changes) {
      const state = stateFor(module, "single", false);
      expect(engines[module].search({ ...state, ...change } as StoreState)).not.toBe(engines[module].search(state));
    }
  });

  it("sorting has guess mode with 10 or 20 items, and none with more", () => {
    const sortingWith = (size: number) =>
      ({
        ...stateFor("sorting", "single", false),
        activeAlgorithm: "insertion",
        size,
        timeline: new Timeline(sortAlgorithms.insertion, generateItems(size, "random", seededRandom(4))),
      }) as StoreState;
    const game = engines.sorting.game;
    expect(game).toBeDefined();
    expect(game!(sortingWith(10)).length).toBeGreaterThan(0);
    expect(game!(sortingWith(20)).length).toBeGreaterThan(0);
    expect(game!(sortingWith(40))).toEqual([]);
    expect(game!(sortingWith(400))).toEqual([]);
  });
});
