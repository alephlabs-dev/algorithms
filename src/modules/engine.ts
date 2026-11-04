import { encodeCells } from "@/pathfinding/grid";
import type { Route } from "@/routes";
import type { StoreState, View } from "@/store";
import type { Size } from "@/types";
import { toPathSearch, toSearch } from "@/urlState";
import { PATH_STEP_WEIGHT, STEP_WEIGHT, type Pace } from "@/utils/speed";

/** The modules the app has. Each one declares its engine here and its interface in ./<id>.tsx. */
export type ModuleId = "sorting" | "pathfinding";

/**
 * What playback needs from a module, without React: how long a run is and
 * how its steps are paced. Read by the store and the playback loop.
 */
export type ModuleEngine = {
  /** The last playback position: a frame index in single view, the race clock in race view. */
  lastIndex: (s: StoreState, view: View) => number;
  /** Share of a beat the step into frame `index` takes in single view (races tick evenly). */
  stepWeight: (s: StoreState, index: number) => number;
  /** Which target pace 1× is tuned to (see utils/speed). */
  pace: (view: View) => Pace;
  /** The page the store is on, within this module. */
  route: (s: StoreState) => Route;
  /** The query string that reproduces the run (array, grid, racers, speed). */
  search: (s: StoreState) => string;
};

export const engines: Record<ModuleId, ModuleEngine> = {
  sorting: {
    lastIndex: (s, view) =>
      view === "race" ? Math.max(0, ...s.raceTimelines.map((t) => t.totalOps)) : s.timeline.length - 1,
    stepWeight: (s, index) => STEP_WEIGHT[s.timeline.kindAt(index) ?? "finish"],
    pace: (view) => view,
    route: (s) => {
      if (s.view === "race") return { kind: "race" };
      return s.isModuleStart ? { kind: "sorting" } : { kind: "algorithm", algorithm: s.activeAlgorithm };
    },
    search: (s) =>
      toSearch({
        // The store only ever holds sizes from the sizes list.
        size: s.size as Size,
        inputOrder: s.inputOrder,
        displayMode: s.displayMode,
        speed: s.speedPreset,
        seed: s.seed,
        raceAlgorithms: s.raceAlgorithms,
      }),
  },
  pathfinding: {
    // Races run on cells examined, so every lane gets the same clock.
    lastIndex: (s, view) =>
      view === "race" ? Math.max(0, ...s.pathRaceTimelines.map((t) => t.totalVisits)) : s.pathTimeline.length - 1,
    stepWeight: (s, index) => PATH_STEP_WEIGHT[s.pathTimeline.stepAt(index)?.type ?? "done"],
    pace: (view) => (view === "race" ? "pathRace" : "pathfinding"),
    route: (s) => {
      if (s.view === "race") return { kind: "pathRace" };
      return s.isModuleStart ? { kind: "pathfinding" } : { kind: "path", algorithm: s.pathAlgorithm };
    },
    search: (s) =>
      toPathSearch({
        gridSize: s.gridSize,
        cells: encodeCells(s.grid.cells),
        start: s.grid.start,
        end: s.grid.end,
        racers: s.pathRaceAlgorithms,
        speed: s.speedPreset,
      }),
  },
};
