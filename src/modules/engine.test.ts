import { describe, expect, it } from "vitest";
import { makeGraph } from "@/graphs";
import { applyPreset, emptyGrid } from "@/pathfinding";
import { moduleOf, routeFromPath, routePath } from "@/routes";
import type { StoreState } from "@/store";
import { readLocation } from "@/urlState";
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
          expect(location.view ?? "single").toBe(view);
          expect(location.speed).toBe("2x");
        }
      }
    });
  }
});
