import { create } from "zustand";
import { Timeline, sortAlgorithms } from "./algorithms";
import { MAX_MOBILE_SIZE } from "./consts/sizesMap";
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
  circleOptions,
  decodePath,
  defaultCircles,
  FourierRun,
  isWave,
  type FourierAlgorithm,
  type FourierShape,
  type Point,
} from "./fourier";
import {
  decodeItems,
  DpRun,
  EXAMPLE_CAPACITY,
  EXAMPLE_ITEMS,
  encodeItems,
  KnapsackRun,
  RACE_CAPACITY,
  RACE_ITEMS,
  KnapsackWork,
  methods,
  randomItems,
  wordPairs,
  type DpAlgorithm,
  type Item,
  type TableRun,
} from "./dp";
import {
  DEFAULT_QUEENS,
  MAX_QUEENS,
  MIN_QUEENS,
  QueensRun,
  SUDOKU_PUZZLES,
  SudokuRun,
  type BacktrackingProblem,
  type FillOrder,
  type SudokuPuzzle,
} from "./backtracking";
import { engines, type ModuleId } from "./modules/engine";
import { forgetAnswers, isAnswered, markAnswered, NEW_SCORE, type Answer, type GameScore, type Question } from "./game";
import {
  decodeOperations,
  presetOperations,
  recordStructure,
  TreeRecorder,
  type Operation,
  type StructureAlgorithm,
  type StructureRun,
  type TreeAlgorithm,
  type StructurePreset,
  type StructureSize,
} from "./structures";
import { MAX_OPERATIONS } from "./structures/link";
import { readLocation } from "./urlState";
import { generateItems } from "./utils/generateItems";
import { newSeed, seededRandom } from "./utils/random";
import { DEFAULT_PRESET, speedFor, type Pace, type SpeedPreset } from "./utils/speed";
import type { Algorithm, DisplayMode, InputOrder } from "./types";

export type View = "single" | "race";
/** Which visualizer is on stage. */
export type Module = ModuleId;
/** What dragging on the grid paints. */
export type Brush = "wall" | "mud";
export type Theme = "dark" | "light";

// Each module has its own tour, remembered separately (sorting keeps its original key).
const TOUR_KEYS: Record<Module, string> = {
  sorting: "tour-done",
  pathfinding: "tour-done-pathfinding",
  graphs: "tour-done-graphs",
  fourier: "tour-done-fourier",
  structures: "tour-done-structures",
  dp: "tour-done-dp",
  backtracking: "tour-done-backtracking",
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

export type StoreState = {
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
  fourierAlgorithm: FourierAlgorithm;
  /** How many circles add up the series. */
  fourierCircles: number;
  fourierShape: FourierShape;
  /** The hand-drawn shape, when `fourierShape` is "custom"; null until it's drawn. */
  fourierPath: Point[] | null;
  /** The whole run, precomputed: where the circles are at every degree. */
  fourierRun: FourierRun;
  structureAlgorithm: StructureAlgorithm;
  /** What "new values" makes, and how many. */
  structurePreset: StructurePreset;
  structureSize: StructureSize;
  /** Every operation so far, starting with the preset's inserts. */
  structureOps: Operation[];
  /** All of them, recorded frame by frame. */
  structureRun: StructureRun;
  /** Race view: BST and AVL on the same operations. */
  structureRaceRuns: TreeRecorder[];
  /** Bumped when the values are replaced wholesale, so nodes don't glide between unrelated trees. */
  structureId: number;
  dpAlgorithm: DpAlgorithm;
  /** The two words: down the side, and across the top. */
  dpA: string;
  dpB: string;
  /** Knapsack: the items (named A, B, C… in order) and the bag's capacity. */
  dpItems: Item[];
  dpCapacity: number;
  /** The table filled and walked back, frame by frame. */
  dpRun: TableRun;
  /** Race view: the knapsack solved three ways, every subproblem each one touches. */
  dpRaceRuns: KnapsackWork[];
  backtrackingProblem: BacktrackingProblem;
  /** N-Queens: the board's size, and how many queens go on it. */
  queensN: number;
  /** The search for the first solution, frame by frame. */
  queensRun: QueensRun;
  /** Sudoku: which preset puzzle, and its search. */
  sudokuPuzzle: SudokuPuzzle;
  /** Which empty cell goes next: row by row, or fewest options first. */
  sudokuOrder: FillOrder;
  sudokuRun: SudokuRun;
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
  /** Effective speed, 0–1 on an exponential scale (see utils/speed). Derived from the preset. */
  speed: number;
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
  setFourierAlgorithm: (algorithm: FourierAlgorithm) => void;
  setFourierCircles: (circles: number) => void;
  /** A ready-made drawing, or "custom" to draw one (which clears the last hand-drawn one). */
  setFourierShape: (shape: FourierShape) => void;
  setFourierPath: (path: Point[]) => void;
  setStructureAlgorithm: (algorithm: StructureAlgorithm) => void;
  applyStructurePreset: (preset: StructurePreset) => void;
  setStructureSize: (size: StructureSize) => void;
  /** Does one more operation and plays it. */
  runOperation: (op: Operation) => void;
  setDpAlgorithm: (algorithm: DpAlgorithm) => void;
  /** New words (already cleaned up); the table starts over. */
  setDpWords: (a: string, b: string) => void;
  /** New knapsack items and capacity; the table starts over. */
  setDpItems: (items: Item[], capacity: number) => void;
  setBacktrackingProblem: (problem: BacktrackingProblem) => void;
  /** A new board size; the search starts over. */
  setQueensN: (n: number) => void;
  setSudokuPuzzle: (puzzle: SudokuPuzzle) => void;
  setSudokuOrder: (order: FillOrder) => void;
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

/** How fast 1× is depends on what's playing. */
const paceOf = (module: Module, view: View): Pace => engines[module].pace(view);

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

/** Numbers mode only fits so many tiles, and phones only so many bars. */
const maxSizeFor = (displayMode: DisplayMode, isMobile: boolean) =>
  displayMode === "numbers" ? (isMobile ? 10 : 20) : isMobile ? MAX_MOBILE_SIZE : Infinity;

const timelineFor = (algorithm: Algorithm, items: readonly number[]) => new Timeline(sortAlgorithms[algorithm], items);

const newRun = (algorithm: Algorithm, items: readonly number[]) => ({
  timeline: timelineFor(algorithm, items),
  frameIndex: 0,
  isPlaying: false,
});

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

// The race is the point of AVL: the same operations, with and without balancing.
const STRUCTURE_RACERS: TreeAlgorithm[] = ["bst", "avl"];

const structureRaceRunsFor = (view: View, ops: Operation[]) =>
  view === "race" ? STRUCTURE_RACERS.map((a) => new TreeRecorder(a, ops)) : [];

/** The table for a problem: two words, or a knapsack. */
const dpRunFor = (algorithm: DpAlgorithm, a: string, b: string, items: Item[], capacity: number): TableRun =>
  algorithm === "knapsack" ? new KnapsackRun(items, capacity) : new DpRun(algorithm, a, b);

const dpRaceRunsFor = (view: View, items: Item[], capacity: number) =>
  view === "race" ? methods.map((m) => new KnapsackWork(m, items, capacity)) : [];

const isTextbookBag = (items: Item[], capacity: number) =>
  capacity === EXAMPLE_CAPACITY && encodeItems(items) === encodeItems(EXAMPLE_ITEMS);

/**
 * Switching dynamic programming's view: the race's runs and, coming from the
 * four-item textbook bag (too small for recursion to repeat itself), the
 * race's own example.
 */
const dpRaceFor = (state: StoreState, view: View) => {
  if (state.module !== "dp") return { dpRaceRuns: [] };
  const swap = view === "race" && isTextbookBag(state.dpItems, state.dpCapacity);
  const dpItems = swap ? RACE_ITEMS : state.dpItems;
  const dpCapacity = swap ? RACE_CAPACITY : state.dpCapacity;
  return {
    dpItems,
    dpCapacity,
    dpRun: swap ? dpRunFor(state.dpAlgorithm, state.dpA, state.dpB, dpItems, dpCapacity) : state.dpRun,
    dpRaceRuns: dpRaceRunsFor(view, dpItems, dpCapacity),
  };
};

/** The runs after the operations change: the single one and, in a race, both racers. */
const structureRunsFor = (state: StoreState, ops: Operation[]) => ({
  structureOps: ops,
  structureRun: recordStructure(state.structureAlgorithm, ops),
  structureRaceRuns: structureRaceRunsFor(state.module === "structures" ? state.view : "single", ops),
  frameIndex: 0,
  isPlaying: false,
});

/** A circle count that fits the series: one of its options, the default if the asked-for one isn't. */
const fitCircles = (algorithm: FourierAlgorithm, circles: number | undefined) => {
  const kind = isWave(algorithm) ? "wave" : "drawing";
  return circles !== undefined && circleOptions[kind].includes(circles) ? circles : defaultCircles[kind];
};

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
  frameIndex: 0,
  isPlaying: false,
});

/** Every search on a grid, after it changes: the single run and the racers. */
const pathRunsFor = (state: StoreState, grid: Grid) => ({
  grid,
  pathTimeline: pathTimelineFor(state.pathAlgorithm, grid),
  pathRaceTimelines: pathRaceTimelinesFor(state.view, state.pathRaceAlgorithms, grid),
  frameIndex: 0,
  isPlaying: false,
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
const initial = (() => {
  const url = readLocation(window.location.pathname, window.location.search);
  const isMobile = window.matchMedia(MOBILE_QUERY).matches;
  const isPortrait = window.matchMedia(PORTRAIT_QUERY).matches;
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
  const structureAlgorithm = url.structureAlgorithm ?? "avl";
  const structurePreset = url.structure.preset ?? "example";
  const structureSize = url.structure.size ?? (isMobile ? "small" : "medium");
  const structureOps =
    (url.structure.ops && decodeOperations(url.structure.ops)) ||
    presetOperations(structurePreset, structureSize, seededRandom(newSeed()));
  const dpAlgorithm = url.dpAlgorithm ?? "edit";
  const dpA = url.dp.a ?? wordPairs[0].a;
  const dpB = url.dp.b ?? wordPairs[0].b;
  // The race opens on its own example, big enough for plain recursion to show its repeats.
  const dpRaceStart = module === "dp" && view === "race";
  const dpItems = (url.dp.items && decodeItems(url.dp.items)) || (dpRaceStart ? RACE_ITEMS : EXAMPLE_ITEMS);
  const dpCapacity = url.dp.capacity ?? (dpRaceStart ? RACE_CAPACITY : EXAMPLE_CAPACITY);
  const queensN = url.backtracking.n ?? DEFAULT_QUEENS;
  const sudokuPuzzle = url.backtracking.puzzle ?? "easy";
  const sudokuOrder = url.backtracking.order ?? "rows";
  const fourierAlgorithm = url.fourierAlgorithm ?? "square";
  const fourierShape = url.fourier.shape ?? "heart";
  const fourierPath = url.fourier.path ? decodePath(url.fourier.path) : null;
  const fourierCircles = fitCircles(fourierAlgorithm, url.fourier.circles);
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
    fourierAlgorithm,
    fourierCircles,
    fourierShape,
    fourierPath,
    fourierRun: new FourierRun(fourierAlgorithm, fourierCircles, fourierShape, fourierPath),
    dpAlgorithm,
    dpA,
    dpB,
    dpItems,
    dpCapacity,
    dpRun: dpRunFor(dpAlgorithm, dpA, dpB, dpItems, dpCapacity),
    dpRaceRuns: dpRaceRunsFor(module === "dp" ? view : "single", dpItems, dpCapacity),
    backtrackingProblem: url.backtrackingProblem ?? ("queens" as BacktrackingProblem),
    queensN,
    queensRun: new QueensRun(queensN),
    sudokuPuzzle,
    sudokuOrder,
    sudokuRun: new SudokuRun(SUDOKU_PUZZLES[sudokuPuzzle], sudokuOrder),
    structureAlgorithm,
    structurePreset,
    structureSize,
    structureOps,
    structureRun: recordStructure(structureAlgorithm, structureOps),
    structureRaceRuns: structureRaceRunsFor(module === "structures" ? view : "single", structureOps),
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
})();

export const useStore = create<StoreState>((set, get) => {
  /** Call after any change that creates a new run. */
  /** After the screen changes shape: upright grids and graphs for narrow screens, wide ones otherwise. */
  const reshape = (before: StoreState) => {
    const state = get();
    if (isNarrow(before) === isNarrow(state)) return;
    state.setGridSize(state.gridSize);
    if (state.graph.aspect !== graphAspect(isNarrow(state))) state.setGraphSize(state.graphSize);
  };

  const applyAutoSpeed = () => {
    const state = get();
    set({ speed: speedFor(state.speedPreset, selectLastIndex(state), paceOf(state.module, state.view)) });
  };

  const start = { ...initial, frameIndex: 0 } as StoreState;

  return {
    ...initial,
    speed: speedFor(initial.speedPreset, selectLastIndex(start), paceOf(initial.module, initial.view)),
    arrayId: 0,
    gridId: 0,
    graphId: 0,
    structureId: 0,
    frameIndex: 0,
    isPlaying: false,
    isScrubbing: false,
    isHelpOpen: false,
    theme: document.documentElement.dataset.theme === "light" ? "light" : "dark",

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
      // A big grid or graph gets a fresh layout at the largest size a race shows well.
      const before = get();
      const fittedGraph =
        before.module === "graphs" ? fitGraphSize(before.graphSize, view, before.isMobile) : before.graphSize;
      if (fittedGraph !== before.graphSize) {
        const graph = makeGraph(before.graphPreset, fittedGraph, isNarrow(before), seededRandom(newSeed()));
        set({
          graphSize: fittedGraph,
          graph,
          graphId: before.graphId + 1,
          graphTimeline: graphTimelineFor(before.graphAlgorithm, graph),
        });
      }
      const fitted = before.module === "pathfinding" ? fitGridSize(before.gridSize, view, before.isMobile) : before.gridSize;
      if (fitted !== before.gridSize) {
        const grid = gridFor(fitted, isNarrow(before), before.gridPreset);
        set({
          gridSize: fitted,
          grid,
          gridId: before.gridId + 1,
          pathTimeline: pathTimelineFor(before.pathAlgorithm, grid),
        });
      }
      set((state) => ({
        view,
        isModuleStart: false,
        frameIndex: 0,
        isPlaying: false,
        raceTimelines: raceTimelinesFor(
          state.module === "sorting" ? view : "single",
          state.raceAlgorithms,
          state.timeline.values,
        ),
        pathRaceTimelines: pathRaceTimelinesFor(
          state.module === "pathfinding" ? view : "single",
          state.pathRaceAlgorithms,
          state.grid,
        ),
        graphRaceTimelines: graphRaceTimelinesFor(
          state.module === "graphs" ? view : "single",
          state.graphRaceAlgorithms,
          state.graph,
        ),
        structureRaceRuns: structureRaceRunsFor(state.module === "structures" ? view : "single", state.structureOps),
        ...dpRaceFor(state, view),
      }));
      applyAutoSpeed();
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
      set((state) => {
        const selected = state.raceAlgorithms.includes(algorithm);
        const count = state.raceAlgorithms.length;
        if ((selected && count <= MIN_RACERS) || (!selected && count >= MAX_RACERS)) return {};
        const order = Object.keys(sortAlgorithms) as Algorithm[];
        const raceAlgorithms = order.filter((a) => (a === algorithm ? !selected : state.raceAlgorithms.includes(a)));
        return {
          raceAlgorithms,
          frameIndex: 0,
          isPlaying: false,
          raceTimelines: raceTimelinesFor(state.view, raceAlgorithms, state.timeline.values),
        };
      });
      applyAutoSpeed();
    },

    togglePathRacer: (algorithm) => {
      set((state) => {
        const selected = state.pathRaceAlgorithms.includes(algorithm);
        const count = state.pathRaceAlgorithms.length;
        if ((selected && count <= MIN_RACERS) || (!selected && count >= MAX_RACERS)) return {};
        const pathRaceAlgorithms = pathOrder.filter((a) =>
          a === algorithm ? !selected : state.pathRaceAlgorithms.includes(a),
        );
        return {
          pathRaceAlgorithms,
          frameIndex: 0,
          isPlaying: false,
          pathRaceTimelines: pathRaceTimelinesFor(state.view, pathRaceAlgorithms, state.grid),
        };
      });
      applyAutoSpeed();
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
      set((state) => ({
        activeAlgorithm: algorithm,
        module: "sorting",
        // Picking one algorithm leaves any race (raceWith goes back to one right after).
        view: "single",
        raceTimelines: [],
        pathRaceTimelines: [],
        graphRaceTimelines: [],
        isModuleStart: false,
        ...newRun(algorithm, state.timeline.values),
      }));
      applyAutoSpeed();
    },

    setSize: (size) => {
      set((state) => {
        const seed = newSeed();
        const items = itemsFor(size, state.inputOrder, seed);
        return {
          size,
          seed,
          arrayId: state.arrayId + 1,
          raceTimelines: raceTimelinesFor(state.view, state.raceAlgorithms, items),
          ...newRun(state.activeAlgorithm, items),
        };
      });
      applyAutoSpeed();
    },

    setInputOrder: (inputOrder) => {
      set({ inputOrder });
      get().createNewArray();
    },

    setSpeedPreset: (speedPreset) => {
      set({ speedPreset });
      applyAutoSpeed();
    },
    setScrubbing: (isScrubbing) => set({ isScrubbing }),
    setHelpOpen: (isHelpOpen) => set({ isHelpOpen }),

    createNewArray: () => {
      const { module, gridPreset, applyGridPreset, graphPreset, applyGraphPreset, setSize, size } = get();
      // In pathfinding, "new" means another layout of the same kind (a clear grid becomes a maze).
      if (module === "pathfinding") applyGridPreset(gridPreset === "clear" ? "maze" : gridPreset);
      else if (module === "graphs") applyGraphPreset(graphPreset);
      else if (module === "structures") get().applyStructurePreset(get().structurePreset);
      else if (module === "dp" && (get().dpAlgorithm === "knapsack" || get().view === "race")) {
        // A new bag: a handful of random items for the same capacity.
        const { dpItems, dpCapacity, setDpItems } = get();
        setDpItems(randomItems(Math.max(4, dpItems.length), seededRandom(newSeed())), dpCapacity);
      } else if (module === "dp") {
        // "New" moves on to the next example pair, wrapping around.
        const { dpA, dpB, setDpWords } = get();
        const at = wordPairs.findIndex((p) => p.a === dpA && p.b === dpB);
        const next = wordPairs[(at + 1) % wordPairs.length];
        setDpWords(next.a, next.b);
      }
      else if (module === "backtracking") {
        // "New": the next board size (wrapping back to the smallest), or the other puzzle.
        const { backtrackingProblem, queensN, setQueensN, sudokuPuzzle, setSudokuPuzzle } = get();
        if (backtrackingProblem === "sudoku") setSudokuPuzzle(sudokuPuzzle === "easy" ? "hard" : "easy");
        else setQueensN(queensN >= MAX_QUEENS ? MIN_QUEENS : queensN + 1);
      }
      else if (module === "fourier") {
        // "New" adds circles, wrapping back to the fewest: the quickest way to see the series converge.
        const { fourierAlgorithm, fourierCircles, setFourierCircles } = get();
        const options = circleOptions[isWave(fourierAlgorithm) ? "wave" : "drawing"];
        setFourierCircles(options[(options.indexOf(fourierCircles) + 1) % options.length]);
      }
      else setSize(size);
    },

    // The grid stays the same so algorithms can be compared on it.
    setPathAlgorithm: (algorithm) => {
      set((state) => ({
        module: "pathfinding",
        view: "single",
        isModuleStart: false,
        pathAlgorithm: algorithm,
        pathTimeline: pathTimelineFor(algorithm, state.grid),
        pathRaceTimelines: [],
        graphRaceTimelines: [],
        frameIndex: 0,
        isPlaying: false,
      }));
      applyAutoSpeed();
    },

    setGridSize: (requested) => {
      set((state) => {
        const gridSize = state.module === "pathfinding" ? fitGridSize(requested, state.view, state.isMobile) : requested;
        const grid = gridFor(gridSize, isNarrow(state), state.gridPreset);
        return { gridSize, gridId: state.gridId + 1, ...pathRunsFor(state, grid) };
      });
      applyAutoSpeed();
    },

    setBrush: (brush) => set({ brush }),

    // The graph stays the same so algorithms can be compared on it.
    setGraphAlgorithm: (algorithm) => {
      set((state) => ({
        module: "graphs",
        view: "single",
        isModuleStart: false,
        graphAlgorithm: algorithm,
        graphTimeline: graphTimelineFor(algorithm, state.graph),
        raceTimelines: [],
        pathRaceTimelines: [],
        graphRaceTimelines: [],
        frameIndex: 0,
        isPlaying: false,
      }));
      applyAutoSpeed();
    },

    setGraphSize: (requested) => {
      set((state) => {
        const graphSize = fitGraphSize(requested, state.view, state.isMobile);
        const graph = makeGraph(state.graphPreset, graphSize, isNarrow(state), seededRandom(newSeed()));
        return { graphSize, ...graphRunFor(state, graph), graphId: state.graphId + 1 };
      });
      applyAutoSpeed();
    },

    applyGraphPreset: (graphPreset) => {
      set((state) => {
        const graph = makeGraph(graphPreset, state.graphSize, isNarrow(state), seededRandom(newSeed()));
        return { graphPreset, ...graphRunFor(state, graph), graphId: state.graphId + 1 };
      });
      applyAutoSpeed();
    },

    editGraph: (graph) => {
      set((state) => graphRunFor(state, graph));
      applyAutoSpeed();
    },

    setStructureAlgorithm: (algorithm) => {
      set((state) => ({
        module: "structures",
        view: "single",
        isModuleStart: false,
        structureAlgorithm: algorithm,
        structureRun: recordStructure(algorithm, state.structureOps),
        raceTimelines: [],
        pathRaceTimelines: [],
        graphRaceTimelines: [],
        structureRaceRuns: [],
        dpRaceRuns: [],
        frameIndex: 0,
        isPlaying: false,
      }));
      applyAutoSpeed();
    },

    applyStructurePreset: (structurePreset) => {
      set((state) => {
        const ops = presetOperations(structurePreset, state.structureSize, seededRandom(newSeed()));
        return { structurePreset, ...structureRunsFor(state, ops), structureId: state.structureId + 1 };
      });
      applyAutoSpeed();
    },

    setStructureSize: (structureSize) => {
      set((state) => {
        const ops = presetOperations(state.structurePreset, structureSize, seededRandom(newSeed()));
        return { structureSize, ...structureRunsFor(state, ops), structureId: state.structureId + 1 };
      });
      applyAutoSpeed();
    },

    runOperation: (op) => {
      set((state) => {
        const ops = [...state.structureOps, op].slice(-MAX_OPERATIONS);
        const runs = structureRunsFor(state, ops);
        // Play just the new operation; a race replays everything, so both trees start even.
        const start = state.view === "race" ? 0 : runs.structureRun.opStarts[runs.structureRun.opStarts.length - 1];
        return { ...runs, frameIndex: start, isPlaying: true };
      });
      applyAutoSpeed();
    },

    setDpAlgorithm: (algorithm) => {
      set((state) => ({
        module: "dp",
        view: "single",
        isModuleStart: false,
        dpAlgorithm: algorithm,
        dpRun: dpRunFor(algorithm, state.dpA, state.dpB, state.dpItems, state.dpCapacity),
        dpRaceRuns: [],
        raceTimelines: [],
        pathRaceTimelines: [],
        graphRaceTimelines: [],
        structureRaceRuns: [],
        frameIndex: 0,
        isPlaying: false,
      }));
      applyAutoSpeed();
    },

    setBacktrackingProblem: (problem) => {
      set((state) => ({
        module: "backtracking",
        view: "single",
        isModuleStart: false,
        backtrackingProblem: problem,
        queensRun: new QueensRun(state.queensN),
        sudokuRun: new SudokuRun(SUDOKU_PUZZLES[state.sudokuPuzzle], state.sudokuOrder),
        dpRaceRuns: [],
        raceTimelines: [],
        pathRaceTimelines: [],
        graphRaceTimelines: [],
        structureRaceRuns: [],
        frameIndex: 0,
        isPlaying: false,
      }));
      applyAutoSpeed();
    },

    setQueensN: (queensN) => {
      set({ queensN, queensRun: new QueensRun(queensN), frameIndex: 0, isPlaying: false });
      applyAutoSpeed();
    },

    setSudokuPuzzle: (sudokuPuzzle) => {
      set((state) => ({
        sudokuPuzzle,
        sudokuRun: new SudokuRun(SUDOKU_PUZZLES[sudokuPuzzle], state.sudokuOrder),
        frameIndex: 0,
        isPlaying: false,
      }));
      applyAutoSpeed();
    },

    setSudokuOrder: (sudokuOrder) => {
      set((state) => ({
        sudokuOrder,
        sudokuRun: new SudokuRun(SUDOKU_PUZZLES[state.sudokuPuzzle], sudokuOrder),
        frameIndex: 0,
        isPlaying: false,
      }));
      applyAutoSpeed();
    },

    setDpWords: (dpA, dpB) => {
      set((state) => ({
        dpA,
        dpB,
        dpRun: dpRunFor(state.dpAlgorithm, dpA, dpB, state.dpItems, state.dpCapacity),
        frameIndex: 0,
        isPlaying: false,
      }));
      applyAutoSpeed();
    },

    setDpItems: (dpItems, dpCapacity) => {
      set((state) => ({
        dpItems,
        dpCapacity,
        dpRun: dpRunFor(state.dpAlgorithm, state.dpA, state.dpB, dpItems, dpCapacity),
        dpRaceRuns: dpRaceRunsFor(state.module === "dp" ? state.view : "single", dpItems, dpCapacity),
        frameIndex: 0,
        isPlaying: false,
      }));
      applyAutoSpeed();
    },

    setFourierAlgorithm: (algorithm) => {
      set((state) => {
        const fourierCircles = fitCircles(algorithm, state.fourierCircles);
        return {
          module: "fourier",
          view: "single",
          isModuleStart: false,
          fourierAlgorithm: algorithm,
          fourierCircles,
          fourierRun: new FourierRun(algorithm, fourierCircles, state.fourierShape, state.fourierPath),
          raceTimelines: [],
          pathRaceTimelines: [],
          graphRaceTimelines: [],
          frameIndex: 0,
          isPlaying: false,
        };
      });
      applyAutoSpeed();
    },

    setFourierCircles: (fourierCircles) => {
      set((state) => ({
        fourierCircles,
        fourierRun: new FourierRun(state.fourierAlgorithm, fourierCircles, state.fourierShape, state.fourierPath),
        frameIndex: 0,
        isPlaying: false,
      }));
      applyAutoSpeed();
    },

    setFourierShape: (fourierShape) => {
      set((state) => {
        const fourierPath = fourierShape === "custom" ? null : state.fourierPath;
        return {
          fourierShape,
          fourierPath,
          fourierRun: new FourierRun(state.fourierAlgorithm, state.fourierCircles, fourierShape, fourierPath),
          frameIndex: 0,
          isPlaying: false,
        };
      });
      applyAutoSpeed();
    },

    setFourierPath: (path) => {
      set((state) => ({
        fourierShape: "custom",
        fourierPath: path,
        fourierRun: new FourierRun(state.fourierAlgorithm, state.fourierCircles, "custom", path),
        frameIndex: 0,
        isPlaying: false,
      }));
      applyAutoSpeed();
    },

    toggleGraphRacer: (algorithm) => {
      set((state) => {
        const selected = state.graphRaceAlgorithms.includes(algorithm);
        const count = state.graphRaceAlgorithms.length;
        if ((selected && count <= MIN_RACERS) || (!selected && count >= MAX_RACERS)) return {};
        const graphRaceAlgorithms = graphOrder.filter((a) =>
          a === algorithm ? !selected : state.graphRaceAlgorithms.includes(a)
        );
        return {
          graphRaceAlgorithms,
          frameIndex: 0,
          isPlaying: false,
          graphRaceTimelines: graphRaceTimelinesFor(state.view, graphRaceAlgorithms, state.graph),
        };
      });
      applyAutoSpeed();
    },

    editGrid: (grid) => {
      set((state) => pathRunsFor(state, grid));
      applyAutoSpeed();
    },

    applyGridPreset: (gridPreset) => {
      set((state) => {
        const grid = applyPreset(state.grid, gridPreset, seededRandom(newSeed()));
        return { gridPreset, gridId: state.gridId + 1, ...pathRunsFor(state, grid) };
      });
      applyAutoSpeed();
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
