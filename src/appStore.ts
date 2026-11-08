import { create } from "zustand";
import { Timeline, sortAlgorithms } from "./algorithms";
import { sizesFor } from "./consts/sizesMap";
import {
  applyPreset,
  decodeCells,
  emptyGrid,
  gridDimensions,
  gridSizes,
  pathSearches,
  PathTimeline,
  type Grid,
  type GridSize,
  type PathAlgorithm,
  type Preset,
} from "./pathfinding";
import {
  decodeGraph,
  graphAspect,
  graphTimelineFor,
  makeGraph,
  type Graph,
  type GraphAlgorithm,
  type GraphPreset,
  type GraphSize,
  type GraphTimeline,
} from "./graphs";
import {
  contextFor,
  engines,
  slices,
  type ModuleId,
  type SliceActions,
  type SliceAlgorithm,
  type SlicedModule,
  type SliceStates,
} from "./modules/engine";
import type { Patch, SliceContext } from "./modules/slice";
import { forgetAnswers, isAnswered, markAnswered, NEW_SCORE, type Answer, type GameScore, type Question } from "./game";
import { readLocation } from "./urlState";
import { generateItems } from "./utils/generateItems";
import { newSeed, seededRandom } from "./utils/random";
import { DEFAULT_PRESET, type SpeedPreset } from "./utils/speed";
import type { Algorithm, DisplayMode, InputOrder } from "./types";

export type View = "single" | "race";
/** Which visualizer is on stage. */
export type Module = ModuleId;
/** What dragging on the grid paints. */
export type Brush = "wall" | "mud";
export type Theme = "dark" | "light";

// Each module has its own tour, remembered separately (sorting keeps its original key).
const LEGACY_TOUR_KEYS: Record<Exclude<Module, SlicedModule>, string> = {
  sorting: "tour-done",
  pathfinding: "tour-done-pathfinding",
  graphs: "tour-done-graphs",
};
const SLICED = Object.keys(slices) as SlicedModule[];
const TOUR_KEYS: Record<Module, string> = {
  ...LEGACY_TOUR_KEYS,
  ...(Object.fromEntries(SLICED.map((m) => [m, slices[m].tourKey])) as Record<SlicedModule, string>),
};

export const tourDone = (module: Module) => {
  try {
    return localStorage.getItem(TOUR_KEYS[module]) === "true";
  } catch {
    return false;
  }
};

export const MIN_RACERS = 2;
export const MAX_RACERS = 4;

export type StoreState = SliceStates & {
  isMobile: boolean;
  /** The window is taller than wide: grids and graphs are laid out upright. */
  isPortrait: boolean;
  module: Module;
  pathAlgorithm: PathAlgorithm;
  gridSize: GridSize;
  grid: Grid;
  /** The last preset applied, so "new maze" (R) makes another of the same kind. */
  gridPreset: Preset;
  brush: Brush;
  /** The whole search on the current grid, precomputed. */
  pathTimeline: PathTimeline;
  graphAlgorithm: GraphAlgorithm;
  /** How many nodes "new layout" makes, and of what kind. */
  graphSize: GraphSize;
  graphPreset: GraphPreset;
  graph: Graph;
  /** The whole run on the current graph, precomputed. */
  graphTimeline: GraphTimeline;
  /** Algorithms racing on the graph, in the picker's order. */
  graphRaceAlgorithms: GraphAlgorithm[];
  /** One timeline per racer, on the current graph. Empty outside race view. */
  graphRaceTimelines: GraphTimeline[];
  /** Bumped when the graph is replaced wholesale, so nodes don't glide between layouts. */
  graphId: number;
  /** Searches racing on the grid, in the picker's order. */
  pathRaceAlgorithms: PathAlgorithm[];
  /** One timeline per racer, on the current grid. Empty outside race view. */
  pathRaceTimelines: PathTimeline[];
  /** Bumped when the grid is replaced wholesale (size, preset), so cells don't animate between layouts. */
  gridId: number;
  /** One algorithm with all the details, or several racing on the same array or grid. */
  view: View;
  /** On the landing page (/), in front of the modules. */
  isLanding: boolean;
  /** On a module's own page (/sorting, /pathfinding): its algorithm shows, but the URL stays there until something is picked. */
  isModuleStart: boolean;
  raceAlgorithms: Algorithm[];
  /** One timeline per racer, on the same array as `timeline`. Empty outside race view. */
  raceTimelines: Timeline[];
  activeAlgorithm: Algorithm;
  size: number;
  displayMode: DisplayMode;
  /** How the generated array starts out (random, reversed...). */
  inputOrder: InputOrder;
  /** The chosen speed, relative to a pace picked for each run. */
  speedPreset: SpeedPreset;
  /** Seeds the current array, so a link can reproduce it exactly. */
  seed: number;
  /** Bumped on every new array so bars remount instead of animating. */
  arrayId: number;
  /** The whole run, precomputed. Frame 0 is the unsorted array. */
  timeline: Timeline;
  /**
   * Playback position. In single view it's a frame index; in race view it's a
   * count of operations (sorting) or cells examined (pathfinding), so every
   * lane runs on the same, fair clock.
   */
  frameIndex: number;
  isPlaying: boolean;
  /** The progress bar is being dragged: bars jump to place instead of animating. */
  isScrubbing: boolean;
  /** The keyboard shortcuts help is open. */
  isHelpOpen: boolean;
  /** Dark (default) or light; saved in this browser and applied by index.html before first paint. */
  theme: Theme;
  /** The guided tour is showing. Opens by itself on the first visit. */
  isTourOpen: boolean;

  /** Each sliced module's actions: `actions.fourier.setCircles(25)`. Each one replaces the run. */
  actions: SliceActions;
  /** Puts a module's algorithm on stage, in single view. */
  pick: <M extends SlicedModule>(module: M, algorithm: SliceAlgorithm<M>) => void;
  setIsMobile: (isMobile: boolean) => void;
  setIsPortrait: (isPortrait: boolean) => void;
  setView: (view: View) => void;
  toggleRaceAlgorithm: (algorithm: Algorithm) => void;
  /** Switch to race view with `algorithm` among the racers. */
  raceWith: (algorithm: Algorithm) => void;
  setDisplayMode: (displayMode: DisplayMode) => void;
  setActiveAlgorithm: (algorithm: Algorithm) => void;
  setSize: (size: number) => void;
  setInputOrder: (inputOrder: InputOrder) => void;
  setSpeedPreset: (preset: SpeedPreset) => void;
  setScrubbing: (isScrubbing: boolean) => void;
  setHelpOpen: (isHelpOpen: boolean) => void;
  setTheme: (theme: Theme) => void;
  openTour: () => void;
  /** Closes the tour (finished or skipped) and remembers it was seen. */
  closeTour: () => void;
  createNewArray: () => void;
  setPathAlgorithm: (algorithm: PathAlgorithm) => void;
  setGraphAlgorithm: (algorithm: GraphAlgorithm) => void;
  setGraphSize: (size: GraphSize) => void;
  applyGraphPreset: (preset: GraphPreset) => void;
  /** Replaces the graph after an edit (moving a node, joining two); the run restarts. */
  editGraph: (graph: Graph) => void;
  toggleGraphRacer: (algorithm: GraphAlgorithm) => void;
  togglePathRacer: (algorithm: PathAlgorithm) => void;
  /** Switch to the pathfinding race with `algorithm` among the racers. */
  pathRaceWith: (algorithm: PathAlgorithm) => void;
  setGridSize: (size: GridSize) => void;
  setBrush: (brush: Brush) => void;
  /** Replaces the grid after an edit (painting, moving a marker); the search restarts. */
  editGrid: (grid: Grid) => void;
  applyGridPreset: (preset: Preset) => void;

  play: () => void;
  /** Guess mode: playback stops before the frames that would give an answer away, and asks. */
  isGameOn: boolean;
  gameScore: GameScore;
  /** The question waiting for an answer, if any. */
  gameQuestion: Question | null;
  /** How the last answer went, for a moment. */
  gameFeedback: { right: boolean; text: string; id: number } | null;
  toggleGame: () => void;
  answerGame: (answer: Answer) => void;
  /** A clean score, and every question of the run on stage asked again. */
  resetGame: () => void;
  pause: () => void;
  /** Moves `steps` frames ahead and stops at the end. Called by the playback loop. */
  advanceBy: (steps: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  seek: (frameIndex: number) => void;
};

export const selectFrame = (state: StoreState) => state.timeline.frameAt(state.frameIndex);
export const selectPathFrame = (state: StoreState) => state.pathTimeline.frameAt(state.frameIndex);
export const selectLastIndex = (state: StoreState) => engines[state.module].lastIndex(state, state.view);

/** The runs the race lanes show: one per racer of the module on stage, none outside race view. */
export const selectRaceRuns = (state: StoreState): readonly unknown[] => {
  if (state.view !== "race") return [];
  const runs: Record<Module, readonly unknown[]> = {
    sorting: state.raceTimelines,
    pathfinding: state.pathRaceTimelines,
    graphs: state.graphRaceTimelines,
    fourier: [],
    structures: state.structures.raceRuns,
    dp: state.dp.raceRuns,
    backtracking: [],
  };
  return runs[state.module];
};
// The playback speed is derived too: selectSpeed lives in modules/engine, so tests can import it without a browser.

/** Guess mode's questions for the run on stage (none in a race, or without guess mode). */
export const gameQuestionsOf = (state: StoreState): Question[] =>
  state.isGameOn && state.view === "single" ? (engines[state.module].game?.(state) ?? []) : [];

/** Guess mode is on and can play the run on stage. */
export const selectGuessPlaying = (state: StoreState) =>
  state.isGameOn &&
  state.view === "single" &&
  engines[state.module].game !== undefined &&
  !engines[state.module].gameUnavailable?.(state);

/** The first unanswered question between the current frame and `target`: playback stops before it. */
const nextQuestion = (state: StoreState, target: number) =>
  gameQuestionsOf(state).find((q) => q.at > state.frameIndex && q.at <= target && !isAnswered(q)) ?? null;

/** The question on screen: only while its run is on stage and playback sits right before it. */
export const selectGameQuestion = (state: StoreState) => {
  const q = state.gameQuestion;
  if (!q || state.frameIndex !== q.at - 1) return null;
  return gameQuestionsOf(state).includes(q) ? q : null;
};

export const MOBILE_QUERY = "(max-width: 768px)";
export const PORTRAIT_QUERY = "(orientation: portrait)";

/** Phones, and any window taller than wide, get upright grids and graphs that fit their stage. */
const isNarrow = (s: { isMobile: boolean; isPortrait: boolean }) => s.isMobile || s.isPortrait;

/** Race lanes are a quarter of the stage, so bigger grids get too small to follow. */
export const raceMaxGridSize = (isMobile: boolean): GridSize => (isMobile ? "small" : "medium");

/** The grid size to use: the one asked for, capped in a pathfinding race. */
const fitGridSize = (size: GridSize, view: View, isMobile: boolean) => {
  const cap = raceMaxGridSize(isMobile);
  return view === "race" && gridSizes.indexOf(size) > gridSizes.indexOf(cap) ? cap : size;
};

/** The biggest size on offer (see sizesFor). */
const maxSizeFor = (displayMode: DisplayMode, isMobile: boolean) => {
  const offered = sizesFor(displayMode, isMobile);
  return offered[offered.length - 1];
};

const timelineFor = (algorithm: Algorithm, items: readonly number[]) => new Timeline(sortAlgorithms[algorithm], items);

const itemsFor = (size: number, order: InputOrder, seed: number) => generateItems(size, order, seededRandom(seed));

// In sidebar order, like any selection the user makes.
const DEFAULT_RACERS: Algorithm[] = ["insertion", "bubble", "quick", "merge"];

const raceTimelinesFor = (view: View, algorithms: Algorithm[], items: readonly number[]) =>
  view === "race" ? algorithms.map((a) => timelineFor(a, items)) : [];

const pathTimelineFor = (algorithm: PathAlgorithm, grid: Grid) => new PathTimeline(pathSearches[algorithm], grid);

// Two that guarantee a shortest path, one that aims for the target, one that doesn't: the classic comparison.
const DEFAULT_PATH_RACERS: PathAlgorithm[] = ["bfs", "dijkstra", "astar", "greedy"];
const pathOrder = Object.keys(pathSearches) as PathAlgorithm[];

const pathRaceTimelinesFor = (view: View, algorithms: PathAlgorithm[], grid: Grid) =>
  view === "race" ? algorithms.map((a) => pathTimelineFor(a, grid)) : [];

// Same goal, different order: breadth against depth, and two ways to the same lightest tree.
const DEFAULT_GRAPH_RACERS: GraphAlgorithm[] = ["bfs", "dfs", "prim", "kruskal"];
const graphOrder: GraphAlgorithm[] = ["bfs", "dfs", "dijkstra", "prim", "kruskal", "topo"];

const graphRaceTimelinesFor = (view: View, algorithms: GraphAlgorithm[], graph: Graph) =>
  view === "race" ? algorithms.map((a) => graphTimelineFor(a, graph)) : [];

/** Race lanes are a quarter of the stage: graphs there stay at a size that reads. */
const fitGraphSize = (size: GraphSize, view: View, isMobile: boolean): GraphSize => {
  const cap: GraphSize = isMobile ? "small" : "medium";
  const order: GraphSize[] = ["small", "medium", "large"];
  return view === "race" && order.indexOf(size) > order.indexOf(cap) ? cap : size;
};

/** Every run on a graph, after it changes: the single run and the racers. */
const graphRunFor = (state: StoreState, graph: Graph) => ({
  graph,
  graphTimeline: graphTimelineFor(state.graphAlgorithm, graph),
  graphRaceTimelines: graphRaceTimelinesFor(state.view, state.graphRaceAlgorithms, graph),
});

/** Every search on a grid, after it changes: the single run and the racers. */
const pathRunsFor = (state: StoreState, grid: Grid) => ({
  grid,
  pathTimeline: pathTimelineFor(state.pathAlgorithm, grid),
  pathRaceTimelines: pathRaceTimelinesFor(state.view, state.pathRaceAlgorithms, grid),
});

/** A fresh grid of the given size with a preset applied. */
const gridFor = (size: GridSize, narrow: boolean, preset: Preset) => {
  const { rows, cols } = gridDimensions(size, narrow);
  return applyPreset(emptyGrid(rows, cols), preset, seededRandom(newSeed()));
};

/** The grid a link describes, if it's valid for the size; otherwise a fresh maze. */
const gridFromLink = (link: ReturnType<typeof readLocation>["path"], size: GridSize, narrow: boolean) => {
  const { rows, cols } = gridDimensions(size, narrow);
  const cells = link.cells ? decodeCells(link.cells, rows * cols) : null;
  const inside = (cell: number | undefined): cell is number => cell !== undefined && cell < rows * cols;
  if (!cells || !inside(link.start) || !inside(link.end) || link.start === link.end)
    return gridFor(size, narrow, "maze");
  cells[link.start] = 0;
  cells[link.end] = 0;
  return { rows, cols, cells, start: link.start, end: link.end };
};

// Start from the link's settings when there are any.
/**
 * What the store starts from, read from the browser by store.ts: the link it opened on
 * and the screen. Passing it in keeps the store free of `window`, so tests can build one.
 */
export type StoreEnv = {
  url: ReturnType<typeof readLocation>;
  isMobile: boolean;
  isPortrait: boolean;
  theme: Theme;
};

/**
 * The slices without their own types, so the store can loop over them. Each slice's
 * types still hold where it's declared (defineModule) and for callers (SliceActions).
 */
type LooseSlice = {
  hydrate: (link: StoreEnv["url"], ctx: SliceContext) => object;
  pick: (slice: object, ctx: SliceContext, algorithm: string) => object;
  actions: Record<string, (slice: object, ctx: SliceContext, ...args: unknown[]) => Patch<object>>;
  newInput: (slice: object, ctx: SliceContext) => Patch<object>;
  playFrom?: Record<string, ((slice: object, ctx: SliceContext) => number) | undefined>;
  forView?: (slice: object, ctx: SliceContext) => object;
};
const looseSlices = slices as unknown as Record<SlicedModule, LooseSlice>;

const slicedOn = (s: StoreState): SlicedModule | null => (s.module in slices ? (s.module as SlicedModule) : null);

/** One module's slice changed, as a store update; null when nothing changes. */
const patchSlice = (
  state: StoreState,
  module: SlicedModule,
  change: (slice: object, ctx: SliceContext) => Patch<object>,
  ctx = contextFor(state, module),
): Partial<StoreState> | null => {
  const patch = change(state[module], ctx);
  return patch && ({ [module]: { ...state[module], ...patch } } as Partial<StoreState>);
};

/**
 * Every slice's race runs after the view or the module on stage changes: `module`
 * gets `view`, the others none. Written once, so no module keeps a stale race.
 */
const racesFor = (state: StoreState, view: View, module: Module = state.module): Partial<StoreState> =>
  Object.assign(
    {},
    ...SLICED.map((m) => {
      const { forView } = looseSlices[m];
      if (!forView) return {};
      return patchSlice(state, m, forView, { ...contextFor(state, m), view: m === module ? view : "single" });
    }),
  );

/** Every sliced module's state, from the link and the screen. */
const hydrateSlices = ({ url, isMobile, isPortrait }: Omit<StoreEnv, "theme">) =>
  Object.fromEntries(
    SLICED.map((module) => {
      const ctx: SliceContext = {
        view: url.module === module ? (url.view ?? "single") : "single",
        isModuleStart: url.isModuleStart,
        speedPreset: url.speed ?? DEFAULT_PRESET,
        isMobile,
        isPortrait,
      };
      return [module, looseSlices[module].hydrate(url, ctx)];
    }),
  ) as SliceStates;

// The race runs of the modules that still live flat in the store, which picking an algorithm drops.
const LEGACY_RACES_DROPPED = {
  raceTimelines: [],
  pathRaceTimelines: [],
  graphRaceTimelines: [],
} satisfies Partial<StoreState>;

const initialState = ({ url, isMobile, isPortrait }: StoreEnv) => {
  const narrow = isNarrow({ isMobile, isPortrait });
  const displayMode = url.displayMode ?? "bars";
  const size = Math.min(url.size ?? (isMobile ? 20 : 40), maxSizeFor(displayMode, isMobile));
  const inputOrder = url.inputOrder ?? "random";
  const seed = url.seed ?? newSeed();
  const activeAlgorithm = url.algorithm ?? "selection";
  const view = url.view ?? "single";
  const raceAlgorithms = url.raceAlgorithms ?? DEFAULT_RACERS;
  const items = itemsFor(size, inputOrder, seed);
  const raceTimelines = raceTimelinesFor(view, raceAlgorithms, items);
  const timeline = timelineFor(activeAlgorithm, items);
  const module: Module = url.module;
  const pathAlgorithm = url.pathAlgorithm ?? "astar";
  const gridSize = fitGridSize(url.path.gridSize ?? (isMobile ? "small" : "medium"), module === "pathfinding" ? view : "single", isMobile);
  const grid = gridFromLink(url.path, gridSize, narrow);
  const pathTimeline = pathTimelineFor(pathAlgorithm, grid);
  const pathRaceAlgorithms = url.path.racers ?? DEFAULT_PATH_RACERS;
  const pathRaceTimelines = pathRaceTimelinesFor(module === "pathfinding" ? view : "single", pathRaceAlgorithms, grid);
  const graphAlgorithm = url.graphAlgorithm ?? "bfs";
  const graphSize = fitGraphSize(url.graph.size ?? "medium", module === "graphs" ? view : "single", isMobile);
  const graphPreset = url.graph.preset ?? "random";
  const graph =
    (url.graph.graph && decodeGraph(url.graph.graph)) || makeGraph(graphPreset, graphSize, narrow, seededRandom(newSeed()));
  return {
    isMobile,
    isPortrait,
    module,
    pathAlgorithm,
    gridSize,
    grid,
    gridPreset: "maze" as Preset,
    brush: "wall" as Brush,
    pathTimeline,
    pathRaceAlgorithms,
    pathRaceTimelines,
    graphAlgorithm,
    graphSize,
    graphPreset,
    graph,
    graphTimeline: graphTimelineFor(graphAlgorithm, graph),
    ...hydrateSlices({ url, isMobile, isPortrait }),
    graphRaceAlgorithms: url.graph.racers ?? DEFAULT_GRAPH_RACERS,
    graphRaceTimelines: graphRaceTimelinesFor(
      module === "graphs" ? view : "single",
      url.graph.racers ?? DEFAULT_GRAPH_RACERS,
      graph
    ),
    view,
    isLanding: url.isLanding,
    isModuleStart: url.isModuleStart,
    raceAlgorithms,
    raceTimelines,
    activeAlgorithm,
    size,
    displayMode,
    inputOrder,
    speedPreset: url.speed ?? DEFAULT_PRESET,
    seed,
    timeline,
  };
};

/** A store that opens on `env`. The app makes one, `useStore` in store.ts. */
export const createAppStore = (env: StoreEnv) => create<StoreState>((set, get) => {
  const initial = initialState(env);
  /** After the screen changes shape: upright grids and graphs for narrow screens, wide ones otherwise. */
  const reshape = (before: StoreState) => {
    const state = get();
    if (isNarrow(before) === isNarrow(state)) return;
    state.setGridSize(state.gridSize);
    if (state.graph.aspect !== graphAspect(isNarrow(state))) state.setGraphSize(state.graphSize);
  };

  /**
   * The one way to put a new run on stage: playback starts over from the first
   * frame and any open guess-mode question goes with the old run. The patch may
   * set its own frameIndex and isPlaying; returning null changes nothing.
   */
  const replaceRun = (patch: (state: StoreState) => Partial<StoreState> | null) =>
    set((state) => {
      const next = patch(state);
      return next ? { frameIndex: 0, isPlaying: false, gameQuestion: null, ...next } : {};
    });

  return {
    ...initial,
    arrayId: 0,
    gridId: 0,
    graphId: 0,
    frameIndex: 0,
    isPlaying: false,
    isScrubbing: false,
    isHelpOpen: false,
    theme: env.theme,

    // A first visit opens the tour of the module it lands on (not the race view, nor the landing page).
    isTourOpen: !tourDone(initial.module) && initial.view === "single" && !initial.isLanding,
    openTour: () => {
      // Each tour walks through the single view of its module.
      if (get().view === "race") get().setView("single");
      get().pause();
      set({ isTourOpen: true, isHelpOpen: false });
    },
    closeTour: () => {
      try {
        localStorage.setItem(TOUR_KEYS[get().module], "true");
      } catch {
        // Blocked storage: the tour may open again next visit.
      }
      set({ isTourOpen: false });
    },

    actions: Object.fromEntries(
      SLICED.map((module) => [
        module,
        Object.fromEntries(
          Object.entries(looseSlices[module].actions).map(([name, action]) => [
            name,
            (...args: unknown[]) =>
              replaceRun((state) => {
                const ctx = contextFor(state, module);
                const patch = patchSlice(state, module, (s) => action(s, ctx, ...args), ctx);
                const playFrom = looseSlices[module].playFrom?.[name];
                if (!patch || !playFrom) return patch;
                return { ...patch, frameIndex: playFrom(patch[module] as object, ctx), isPlaying: true };
              }),
          ]),
        ),
      ]),
    ) as SliceActions,

    pick: (module, algorithm) => {
      replaceRun((state) => {
        // Picking one algorithm leaves any race.
        const races = racesFor(state, "single", module);
        const ctx = { ...contextFor(state, module), view: "single" as const, isModuleStart: false };
        const pick = (s: object) => looseSlices[module].pick(s, ctx, algorithm);
        const picked = patchSlice({ ...state, ...races }, module, pick, ctx);
        return { module, view: "single", isModuleStart: false, ...LEGACY_RACES_DROPPED, ...races, ...picked };
      });
    },

    setTheme: (theme) => {
      document.documentElement.dataset.theme = theme;
      // The browser's toolbar takes the page background, read from the theme now that it's applied.
      const background = getComputedStyle(document.documentElement).getPropertyValue("--color-background").trim();
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", background);
      try {
        localStorage.setItem("theme", theme);
      } catch {
        // Private mode or blocked storage: the theme still applies for this visit.
      }
      set({ theme });
    },

    // Shrinks the array if the screen got too small for it (e.g. rotating a tablet).
    setIsMobile: (isMobile) => {
      const before = get();
      set({ isMobile });
      reshape(before);
      const { size, displayMode, setSize } = get();
      const maxSize = maxSizeFor(displayMode, isMobile);
      if (size > maxSize) setSize(maxSize);
    },

    setIsPortrait: (isPortrait) => {
      const before = get();
      set({ isPortrait });
      reshape(before);
    },

    // Within the module on screen: sorting races on the array, pathfinding on the grid.
    setView: (view) => {
      replaceRun((state) => {
        // A big grid or graph gets a fresh layout at the largest size a race shows well.
        const graphSize = state.module === "graphs" ? fitGraphSize(state.graphSize, view, state.isMobile) : state.graphSize;
        const refitGraph = graphSize !== state.graphSize;
        const graph = refitGraph
          ? makeGraph(state.graphPreset, graphSize, isNarrow(state), seededRandom(newSeed()))
          : state.graph;
        const gridSize = state.module === "pathfinding" ? fitGridSize(state.gridSize, view, state.isMobile) : state.gridSize;
        const refitGrid = gridSize !== state.gridSize;
        const grid = refitGrid ? gridFor(gridSize, isNarrow(state), state.gridPreset) : state.grid;
        return {
          view,
          isModuleStart: false,
          ...(refitGraph && {
            graphSize,
            graph,
            graphId: state.graphId + 1,
            graphTimeline: graphTimelineFor(state.graphAlgorithm, graph),
          }),
          ...(refitGrid && {
            gridSize,
            grid,
            gridId: state.gridId + 1,
            pathTimeline: pathTimelineFor(state.pathAlgorithm, grid),
          }),
          raceTimelines: raceTimelinesFor(
            state.module === "sorting" ? view : "single",
            state.raceAlgorithms,
            state.timeline.values,
          ),
          pathRaceTimelines: pathRaceTimelinesFor(
            state.module === "pathfinding" ? view : "single",
            state.pathRaceAlgorithms,
            grid,
          ),
          graphRaceTimelines: graphRaceTimelinesFor(
            state.module === "graphs" ? view : "single",
            state.graphRaceAlgorithms,
            graph,
          ),
          ...racesFor(state, view),
        };
      });
    },

    // Keeps between MIN_RACERS and MAX_RACERS lanes, in the sidebar's order.
    raceWith: (algorithm) => {
      const { raceAlgorithms, setView, module, setActiveAlgorithm, activeAlgorithm } = get();
      if (module !== "sorting") setActiveAlgorithm(activeAlgorithm);
      if (!raceAlgorithms.includes(algorithm)) {
        // Replace the last racer if the race is full; keep the sidebar order.
        const kept = raceAlgorithms.length >= MAX_RACERS ? raceAlgorithms.slice(0, -1) : raceAlgorithms;
        const order = Object.keys(sortAlgorithms) as Algorithm[];
        set({ raceAlgorithms: order.filter((a) => a === algorithm || kept.includes(a)) });
      }
      setView("race");
    },

    toggleRaceAlgorithm: (algorithm) => {
      replaceRun((state) => {
        const selected = state.raceAlgorithms.includes(algorithm);
        const count = state.raceAlgorithms.length;
        if ((selected && count <= MIN_RACERS) || (!selected && count >= MAX_RACERS)) return null;
        const order = Object.keys(sortAlgorithms) as Algorithm[];
        const raceAlgorithms = order.filter((a) => (a === algorithm ? !selected : state.raceAlgorithms.includes(a)));
        return {
          raceAlgorithms,
          raceTimelines: raceTimelinesFor(state.view, raceAlgorithms, state.timeline.values),
        };
      });
    },

    togglePathRacer: (algorithm) => {
      replaceRun((state) => {
        const selected = state.pathRaceAlgorithms.includes(algorithm);
        const count = state.pathRaceAlgorithms.length;
        if ((selected && count <= MIN_RACERS) || (!selected && count >= MAX_RACERS)) return null;
        const pathRaceAlgorithms = pathOrder.filter((a) =>
          a === algorithm ? !selected : state.pathRaceAlgorithms.includes(a),
        );
        return {
          pathRaceAlgorithms,
          pathRaceTimelines: pathRaceTimelinesFor(state.view, pathRaceAlgorithms, state.grid),
        };
      });
    },

    pathRaceWith: (algorithm) => {
      const { pathRaceAlgorithms, setView } = get();
      if (!pathRaceAlgorithms.includes(algorithm)) {
        const kept = pathRaceAlgorithms.length >= MAX_RACERS ? pathRaceAlgorithms.slice(0, -1) : pathRaceAlgorithms;
        set({ pathRaceAlgorithms: pathOrder.filter((a) => a === algorithm || kept.includes(a)) });
      }
      setView("race");
    },

    setDisplayMode: (displayMode) => {
      set({ displayMode });
      const { size, isMobile, setSize } = get();
      const maxSize = maxSizeFor(displayMode, isMobile);
      if (size > maxSize) setSize(maxSize);
    },

    // Keeps the same array so algorithms can be compared on identical data.
    setActiveAlgorithm: (algorithm) => {
      replaceRun((state) => ({
        activeAlgorithm: algorithm,
        module: "sorting",
        // Picking one algorithm leaves any race (raceWith goes back to one right after).
        view: "single",
        raceTimelines: [],
        pathRaceTimelines: [],
        graphRaceTimelines: [],
        isModuleStart: false,
        ...racesFor(state, "single"),
        timeline: timelineFor(algorithm, state.timeline.values),
      }));
    },

    setSize: (size) => {
      replaceRun((state) => {
        const seed = newSeed();
        const items = itemsFor(size, state.inputOrder, seed);
        return {
          size,
          seed,
          arrayId: state.arrayId + 1,
          raceTimelines: raceTimelinesFor(state.view, state.raceAlgorithms, items),
          timeline: timelineFor(state.activeAlgorithm, items),
        };
      });
    },

    setInputOrder: (inputOrder) => {
      set({ inputOrder });
      get().createNewArray();
    },

    setSpeedPreset: (speedPreset) => set({ speedPreset }),
    setScrubbing: (isScrubbing) => set({ isScrubbing }),
    setHelpOpen: (isHelpOpen) => set({ isHelpOpen }),

    createNewArray: () => {
      const sliced = slicedOn(get());
      if (sliced) {
        replaceRun((state) => patchSlice(state, sliced, (s, ctx) => looseSlices[sliced].newInput(s, ctx)));
        return;
      }
      const { module, gridPreset, applyGridPreset, graphPreset, applyGraphPreset, setSize, size } = get();
      // In pathfinding, "new" means another layout of the same kind (a clear grid becomes a maze).
      if (module === "pathfinding") applyGridPreset(gridPreset === "clear" ? "maze" : gridPreset);
      else if (module === "graphs") applyGraphPreset(graphPreset);
      else setSize(size);
    },

    // The grid stays the same so algorithms can be compared on it.
    setPathAlgorithm: (algorithm) => {
      replaceRun((state) => ({
        module: "pathfinding",
        view: "single",
        isModuleStart: false,
        ...racesFor(state, "single"),
        pathAlgorithm: algorithm,
        pathTimeline: pathTimelineFor(algorithm, state.grid),
        pathRaceTimelines: [],
        graphRaceTimelines: [],
      }));
    },

    setGridSize: (requested) => {
      replaceRun((state) => {
        const gridSize = state.module === "pathfinding" ? fitGridSize(requested, state.view, state.isMobile) : requested;
        const grid = gridFor(gridSize, isNarrow(state), state.gridPreset);
        return { gridSize, gridId: state.gridId + 1, ...pathRunsFor(state, grid) };
      });
    },

    setBrush: (brush) => set({ brush }),

    // The graph stays the same so algorithms can be compared on it.
    setGraphAlgorithm: (algorithm) => {
      replaceRun((state) => ({
        module: "graphs",
        view: "single",
        isModuleStart: false,
        ...racesFor(state, "single"),
        graphAlgorithm: algorithm,
        graphTimeline: graphTimelineFor(algorithm, state.graph),
        raceTimelines: [],
        pathRaceTimelines: [],
        graphRaceTimelines: [],
      }));
    },

    setGraphSize: (requested) => {
      replaceRun((state) => {
        const graphSize = fitGraphSize(requested, state.view, state.isMobile);
        const graph = makeGraph(state.graphPreset, graphSize, isNarrow(state), seededRandom(newSeed()));
        return { graphSize, ...graphRunFor(state, graph), graphId: state.graphId + 1 };
      });
    },

    applyGraphPreset: (graphPreset) => {
      replaceRun((state) => {
        const graph = makeGraph(graphPreset, state.graphSize, isNarrow(state), seededRandom(newSeed()));
        return { graphPreset, ...graphRunFor(state, graph), graphId: state.graphId + 1 };
      });
    },

    editGraph: (graph) => {
      replaceRun((state) => graphRunFor(state, graph));
    },


    toggleGraphRacer: (algorithm) => {
      replaceRun((state) => {
        const selected = state.graphRaceAlgorithms.includes(algorithm);
        const count = state.graphRaceAlgorithms.length;
        if ((selected && count <= MIN_RACERS) || (!selected && count >= MAX_RACERS)) return null;
        const graphRaceAlgorithms = graphOrder.filter((a) =>
          a === algorithm ? !selected : state.graphRaceAlgorithms.includes(a)
        );
        return {
          graphRaceAlgorithms,
          graphRaceTimelines: graphRaceTimelinesFor(state.view, graphRaceAlgorithms, state.graph),
        };
      });
    },

    editGrid: (grid) => {
      replaceRun((state) => pathRunsFor(state, grid));
    },

    applyGridPreset: (gridPreset) => {
      replaceRun((state) => {
        const grid = applyPreset(state.grid, gridPreset, seededRandom(newSeed()));
        return { gridPreset, gridId: state.gridId + 1, ...pathRunsFor(state, grid) };
      });
    },

    play: () =>
      set((state) => ({
        isPlaying: true,
        gameFeedback: null,
        // Replay from the start if the run already finished.
        frameIndex: state.frameIndex >= selectLastIndex(state) ? 0 : state.frameIndex,
      })),

    isGameOn: false,
    gameScore: NEW_SCORE,
    gameQuestion: null,
    gameFeedback: null,

    toggleGame: () =>
      set((state) => ({
        isGameOn: !state.isGameOn,
        gameQuestion: null,
        gameFeedback: null,
        // Turning it on stops playback, so the first question isn't missed mid-run.
        isPlaying: state.isGameOn ? state.isPlaying : false,
      })),

    answerGame: (answer) =>
      set((state) => {
        const q = state.gameQuestion;
        if (!q) return {};
        const right = answer === q.answer;
        markAnswered(q);
        const streak = right ? state.gameScore.streak + 1 : 0;
        return {
          gameQuestion: null,
          gameFeedback: { right, text: q.explain(right), id: Date.now() },
          gameScore: {
            asked: state.gameScore.asked + 1,
            right: state.gameScore.right + (right ? 1 : 0),
            streak,
            best: Math.max(state.gameScore.best, streak),
          },
          // Carry on, to show what happens.
          isPlaying: true,
        };
      }),

    resetGame: () =>
      set((state) => {
        const run = gameQuestionsOf(state)[0]?.run;
        if (run) forgetAnswers(run);
        return { gameScore: NEW_SCORE, gameQuestion: null, gameFeedback: null };
      }),

    pause: () => set({ isPlaying: false }),

    advanceBy: (steps) =>
      set((state) => {
        const lastIndex = selectLastIndex(state);
        const frameIndex = Math.min(state.frameIndex + steps, lastIndex);
        const ask = nextQuestion(state, frameIndex);
        if (ask) return { frameIndex: ask.at - 1, isPlaying: false, gameQuestion: ask };
        return { frameIndex, isPlaying: frameIndex < lastIndex };
      }),

    stepForward: () =>
      set((state) => {
        const frameIndex = Math.min(state.frameIndex + 1, selectLastIndex(state));
        const ask = nextQuestion(state, frameIndex);
        if (ask) return { frameIndex: ask.at - 1, isPlaying: false, gameQuestion: ask };
        return { isPlaying: false, frameIndex };
      }),

    stepBackward: () =>
      set((state) => ({
        isPlaying: false,
        gameQuestion: null,
        frameIndex: Math.max(state.frameIndex - 1, 0),
      })),

    seek: (frameIndex) =>
      set((state) => ({
        frameIndex: Math.min(Math.max(frameIndex, 0), selectLastIndex(state)),
      })),
  };
});

export type AppStore = ReturnType<typeof createAppStore>;
