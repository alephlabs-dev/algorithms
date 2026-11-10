import type { Question } from "@/game";
import { modulePages, moduleRoute, type ModuleId, type Route } from "@/routes";
import type { StoreState, View } from "@/store";
import { speedFor, type Pace } from "@/utils/speed";
import { backtrackingSlice } from "./backtracking.slice";
import { dpSlice } from "./dp.slice";
import { fourierSlice } from "./fourier.slice";
import { graphsSlice } from "./graphs.slice";
import { mazesSlice } from "./mazes/slice";
import { pathfindingSlice } from "./pathfinding.slice";
import type { BoundSlice, ModuleSlice, SliceContext } from "./slice";
import { sortingSlice } from "./sorting.slice";
import { structuresSlice } from "./structures.slice";

/** The modules the app has (their pages are in @/routes). Each one declares its slice in ./<id>.slice.ts and its interface in ./<id>.tsx. */
export type { ModuleId };

/**
 * Every module's slice, by id: the one place a module is registered with the store.
 * The store holds each slice's state under its id and binds its actions.
 */
export const slices = {
  sorting: sortingSlice,
  pathfinding: pathfindingSlice,
  graphs: graphsSlice,
  fourier: fourierSlice,
  structures: structuresSlice,
  dp: dpSlice,
  backtracking: backtrackingSlice,
  mazes: mazesSlice,
} satisfies Record<ModuleId, unknown>;

export const MODULES = Object.keys(slices) as ModuleId[];

/** Each module's state, under its id. */
export type SliceStates = { [M in ModuleId]: ReturnType<(typeof slices)[M]["hydrate"]> };
/** Each module's actions, bound by the store: `s.actions.fourier.setCircles(25)`. */
export type SliceActions = { [M in ModuleId]: BoundSlice<(typeof slices)[M]> };
/** A module's part of the link, as its slice reads it (see ./slice.ts Link). */
export type SliceLink<M extends ModuleId> = Parameters<(typeof slices)[M]["hydrate"]>[0];
/** The algorithms a module can put on stage (in backtracking, the problems). */
export type SliceAlgorithm<M extends ModuleId> = ReturnType<(typeof slices)[M]["current"]>;

/** What a module's slice reads from the shared store: its own view is single while it's off stage. */
export const contextFor = (s: StoreState, module: ModuleId): SliceContext => ({
  view: s.module === module ? s.view : "single",
  isModuleStart: s.isModuleStart,
  speedPreset: s.speedPreset,
  isMobile: s.isMobile,
  isPortrait: s.isPortrait,
});

/**
 * The page a module is on, the same way for every module: its race (if it has
 * one), its start page, or `algorithm`'s page.
 */
export const routeIn = (module: ModuleId, algorithm: string, ctx: SliceContext): Route => {
  if (ctx.view === "race" && modulePages[module].race) return moduleRoute(module, "race");
  return ctx.isModuleStart ? moduleRoute(module, "start") : moduleRoute(module, "algorithm", algorithm);
};

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
  /** The algorithm on stage in this module (in backtracking, the problem), on stage or not. */
  current: (s: StoreState) => string;
  /** The page the store is on, within this module. */
  route: (s: StoreState) => Route;
  /** The query string that reproduces the run (array, grid, racers, speed). */
  search: (s: StoreState) => string;
  /** Guess mode: the questions for the run on stage, in frame order. Without it, the module has no guess mode. */
  game?: (s: StoreState) => Question[];
  /** Why guess mode can't play the run on stage, shown on its toggle; null when it can. */
  gameUnavailable?: (s: StoreState) => string | null;
};

/** A slice's engine, read from the whole store. */
const engineOf = (module: ModuleId): ModuleEngine => {
  // Each slice's types hold where it's declared; here they're read through one shape.
  const slice = slices[module] as unknown as ModuleSlice<object, string, object, never>;
  const { engine } = slice;
  const read = (s: StoreState) => s[module] as object;
  const { game, gameUnavailable } = engine;
  return {
    lastIndex: (s, view) => engine.lastIndex(read(s), view),
    stepWeight: (s, index) => engine.stepWeight(read(s), index),
    pace: engine.pace,
    current: (s) => slice.current(read(s)),
    route: (s) => routeIn(module, slice.current(read(s)), contextFor(s, module)),
    search: (s) => engine.search(read(s), contextFor(s, module)),
    ...(game && { game: (s: StoreState) => game(read(s)) }),
    ...(gameUnavailable && { gameUnavailable: (s: StoreState) => gameUnavailable(read(s)) }),
  };
};

export const engines = Object.fromEntries(MODULES.map((m) => [m, engineOf(m)])) as Record<ModuleId, ModuleEngine>;

/**
 * The speed playback runs at: the chosen preset, as a multiple of the pace of the
 * run on stage. Worked out from the state, so it follows every new run by itself.
 */
export const selectSpeed = (s: StoreState) => {
  const engine = engines[s.module];
  return speedFor(s.speedPreset, engine.lastIndex(s, s.view), engine.pace(s.view));
};
