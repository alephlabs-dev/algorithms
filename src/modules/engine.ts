import { runOf } from "@/backtracking";
import type { BacktrackingEventType } from "@/backtracking/types";
import { localized } from "@/i18n";
import { encodePath } from "@/fourier/shapes";
import { encodeGraph } from "@/graphs/graph";
import { encodeCells } from "@/pathfinding/grid";
import type { Route } from "@/routes";
import type { StoreState, View } from "@/store";
import type { Size } from "@/types";
import { encodeOperations } from "@/structures/link";
import type { HashEvent, TreeEvent } from "@/structures/types";
import { sizes } from "@/consts/sizesMap";
import { encodeItems } from "@/dp/presets";
import { dpQuestions, questionsOf, SORT_GUESS_MAX_SIZE, sortQuestions, structureQuestions, type Question } from "@/game";
import { toBacktrackingSearch, toDpSearch, toFourierSearch, toGraphSearch, toPathSearch, toSearch, toStructureSearch } from "@/urlState";
import type { DpEvent } from "@/dp/types";
import { GRAPH_STEP_WEIGHT, PATH_STEP_WEIGHT, STEP_WEIGHT, type Pace } from "@/utils/speed";

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
  fourier: {
    // A frame per degree; every frame gets the same beat, so circles turn at an even pace.
    lastIndex: (s) => s.fourierRun.length - 1,
    stepWeight: () => 1,
    pace: () => "fourier",
    route: (s) => (s.isModuleStart ? { kind: "fourier" } : { kind: "series", algorithm: s.fourierAlgorithm }),
    search: (s) =>
      toFourierSearch({
        circles: s.fourierCircles,
        // Only drawings have a shape; a hand-drawn one travels in the link.
        ...(s.fourierAlgorithm === "epicycles" && { shape: s.fourierShape }),
        ...(s.fourierAlgorithm === "epicycles" &&
          s.fourierShape === "custom" &&
          s.fourierPath && { path: encodePath(s.fourierPath) }),
        speed: s.speedPreset,
      }),
  },
  structures: {
    // Races tick one frame per lane, so the clock runs until the longer run is done.
    lastIndex: (s, view) =>
      view === "race"
        ? Math.max(0, ...s.structureRaceRuns.map((r) => r.frames.length - 1))
        : s.structureRun.frames.length - 1,
    stepWeight: (s, index) => STRUCTURE_STEP_WEIGHT[s.structureRun.frames[index]?.event.type ?? "done"],
    pace: (view) => (view === "race" ? "structureRace" : "structures"),
    route: (s) => {
      if (s.view === "race") return { kind: "structureRace" };
      return s.isModuleStart ? { kind: "structures" } : { kind: "structure", algorithm: s.structureAlgorithm };
    },
    search: (s) =>
      toStructureSearch({
        ops: encodeOperations(s.structureOps),
        size: s.structureSize,
        preset: s.structurePreset,
        speed: s.speedPreset,
      }),
    game: (s) => questionsOf(s.structureRun, structureQuestions),
  },
  dp: {
    // The race clock counts subproblems: it runs until the slowest method is done.
    lastIndex: (s, view) =>
      view === "race" ? Math.max(0, ...s.dpRaceRuns.map((r) => r.length - 1)) : s.dpRun.length - 1,
    stepWeight: (s, index) => DP_STEP_WEIGHT[s.dpRun.frames[index]?.event.type ?? "done"],
    pace: (view) => (view === "race" ? "dpRace" : "dp"),
    route: (s) => {
      if (s.view === "race") return { kind: "dpRace" };
      return s.isModuleStart ? { kind: "dp" } : { kind: "dpProblem", algorithm: s.dpAlgorithm };
    },
    // A knapsack (or its race) links its items; the word problems their words.
    search: (s) =>
      s.dpAlgorithm === "knapsack" || s.view === "race"
        ? toDpSearch({ items: encodeItems(s.dpItems), capacity: s.dpCapacity, speed: s.speedPreset })
        : toDpSearch({ a: s.dpA, b: s.dpB, speed: s.speedPreset }),
    game: (s) => questionsOf(s.dpRun, dpQuestions),
  },
  backtracking: {
    lastIndex: (s) => runOf(s).length - 1,
    stepWeight: (s, index) => BACKTRACKING_STEP_WEIGHT[runOf(s).frameAt(index).event.type],
    pace: () => "backtracking",
    route: (s) =>
      s.isModuleStart ? { kind: "backtracking" } : { kind: "backtrackingProblem", algorithm: s.backtrackingProblem },
    // N-Queens links its board size; Sudoku its puzzle.
    search: (s) =>
      toBacktrackingSearch(
        s.backtrackingProblem === "sudoku"
          ? { puzzle: s.sudokuPuzzle, speed: s.speedPreset }
          : { n: s.queensN, speed: s.speedPreset },
      ),
  },
};

/** Conflicts flick past; a queen or digit placed or taken back gets the full beat, a dead end a longer one. */
const BACKTRACKING_STEP_WEIGHT: Record<BacktrackingEventType, number> = {
  start: 0.7,
  conflict: 0.4,
  choice: 1,
  deadEnd: 1.2,
  backtrack: 1,
  done: 0.5,
};

/** Cells fill briskly; the way back, the part that answers the question, gets a longer beat. */
const DP_STEP_WEIGHT: Record<DpEvent["type"], number> = {
  start: 0.7,
  base: 1.2,
  cell: 0.8,
  trace: 1.4,
  done: 0.5,
};

/** A rotation gets the longest beat, so the nodes can be seen gliding; going back up is quick. */
const STRUCTURE_STEP_WEIGHT: Record<TreeEvent["type"] | HashEvent["type"], number> = {
  start: 0.7,
  compare: 0.8,
  place: 1,
  duplicate: 1,
  found: 1,
  missing: 1,
  remove: 1,
  removed: 1,
  successor: 1,
  height: 0.5,
  rotate: 1.6,
  // Heap: a swap glides like a rotation; scanning slot after slot is quick.
  append: 1,
  sift: 0.7,
  swap: 1.3,
  scan: 0.5,
  take: 1,
  lift: 1.3,
  // Hash tables: the jump to a bucket is the point, so it gets a beat.
  hash: 1,
  probe: 0.7,
  full: 1,
  done: 0.4,
};
