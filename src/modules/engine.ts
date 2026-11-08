import { localized } from "@/i18n";
import { encodeGraph } from "@/graphs/graph";
import { encodeCells } from "@/pathfinding/grid";
import type { Route } from "@/routes";
import type { StoreState, View } from "@/store";
import type { Size } from "@/types";
import { sizes } from "@/consts/sizesMap";
import { questionsOf, SORT_GUESS_MAX_SIZE, sortQuestions, type Question } from "@/game";
import { toGraphSearch, toPathSearch, toSearch } from "@/urlState";
import { backtrackingSlice } from "./backtracking.slice";
import { dpSlice } from "./dp.slice";
import { fourierSlice } from "./fourier.slice";
import { structuresSlice } from "./structures.slice";
import type { Bound, ModuleSlice, SliceContext } from "./slice";
import { GRAPH_STEP_WEIGHT, PATH_STEP_WEIGHT, speedFor, STEP_WEIGHT, type Pace } from "@/utils/speed";

/** The modules the app has. Each one declares its engine here and its interface in ./<id>.tsx. */
export type ModuleId = "sorting" | "pathfinding" | "graphs" | "fourier" | "structures" | "dp" | "backtracking";

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
  /** Guess mode: the questions for the run on stage, in frame order. Without it, the module has no guess mode. */
  game?: (s: StoreState) => Question[];
  /** Why guess mode can't play the run on stage, shown on its toggle; null when it can. */
  gameUnavailable?: (s: StoreState) => string | null;
};

/**
 * The modules declared as slices (./<id>.slice.ts), by id. The store holds one slice
 * per module under its id. Modules not listed here still live flat in the store (#126).
 */
export const slices = {
  fourier: fourierSlice,
  backtracking: backtrackingSlice,
  structures: structuresSlice,
  dp: dpSlice,
};

export type SlicedModule = keyof typeof slices;
/** Each sliced module's state, under its id. */
export type SliceStates = { [M in SlicedModule]: ReturnType<(typeof slices)[M]["hydrate"]> };
/** Each sliced module's actions, bound by the store: `s.actions.fourier.setCircles(25)`. */
export type SliceActions = { [M in SlicedModule]: Bound<(typeof slices)[M]["actions"]> };
/** The algorithms a sliced module can put on stage. */
export type SliceAlgorithm<M extends SlicedModule> = ReturnType<(typeof slices)[M]["current"]>;

/** What a module's slice reads from the shared store: its own view is single while it's off stage. */
export const contextFor = (s: StoreState, module: ModuleId): SliceContext => ({
  view: s.module === module ? s.view : "single",
  isModuleStart: s.isModuleStart,
  speedPreset: s.speedPreset,
  isMobile: s.isMobile,
  isPortrait: s.isPortrait,
});

/** A slice's engine, read from the whole store. */
const engineOf = <S>(
  module: ModuleId,
  engine: ModuleSlice<S, never, never>["engine"],
  read: (s: StoreState) => S,
): ModuleEngine => {
  const { game, gameUnavailable } = engine;
  return {
    lastIndex: (s, view) => engine.lastIndex(read(s), view),
    stepWeight: (s, index) => engine.stepWeight(read(s), index),
    pace: engine.pace,
    route: (s) => engine.route(read(s), contextFor(s, module)),
    search: (s) => engine.search(read(s), contextFor(s, module)),
    ...(game && { game: (s: StoreState) => game(read(s)) }),
    ...(gameUnavailable && { gameUnavailable: (s: StoreState) => gameUnavailable(read(s)) }),
  };
};

/**
 * The sizes Guess plays with in sorting, in words ("10 or 20"); the tour says them too.
 * Bigger arrays have bars too thin to follow and too many moments to stop at.
 */
const guessText = localized({
  en: { or: " or ", unavailable: (sizes: string) => `Guess works with ${sizes} items` },
  es: { or: " o ", unavailable: (sizes) => `Adivina funciona con ${sizes} elementos` },
});
export const sortGuessSizes = sizes.filter((size) => size <= SORT_GUESS_MAX_SIZE).join(guessText.or);
const sortGuessUnavailable = (s: StoreState) =>
  s.size <= SORT_GUESS_MAX_SIZE ? null : guessText.unavailable(sortGuessSizes);

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
    game: (s) =>
      sortGuessUnavailable(s) ? [] : questionsOf(s.timeline, (run) => sortQuestions(run, s.activeAlgorithm)),
    gameUnavailable: sortGuessUnavailable,
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
  graphs: {
    // Races tick one step per lane, so the clock runs until the longest run is over.
    lastIndex: (s, view) =>
      view === "race" ? Math.max(0, ...s.graphRaceTimelines.map((t) => t.length - 1)) : s.graphTimeline.length - 1,
    stepWeight: (s, index) => GRAPH_STEP_WEIGHT[s.graphTimeline.stepAt(index)?.type ?? "done"],
    pace: (view) => (view === "race" ? "graphRace" : "graphs"),
    route: (s) => {
      if (s.view === "race") return { kind: "graphRace" };
      return s.isModuleStart ? { kind: "graphs" } : { kind: "graph", algorithm: s.graphAlgorithm };
    },
    search: (s) =>
      toGraphSearch({
        graph: encodeGraph(s.graph),
        size: s.graphSize,
        preset: s.graphPreset,
        racers: s.graphRaceAlgorithms,
        speed: s.speedPreset,
      }),
  },
  fourier: engineOf("fourier", slices.fourier.engine, (s) => s.fourier),
  structures: engineOf("structures", slices.structures.engine, (s) => s.structures),
  dp: engineOf("dp", slices.dp.engine, (s) => s.dp),
  backtracking: engineOf("backtracking", slices.backtracking.engine, (s) => s.backtracking),
};

/**
 * The speed playback runs at: the chosen preset, as a multiple of the pace of the
 * run on stage. Worked out from the state, so it follows every new run by itself.
 */
export const selectSpeed = (s: StoreState) => {
  const engine = engines[s.module];
  return speedFor(s.speedPreset, engine.lastIndex(s, s.view), engine.pace(s.view));
};
