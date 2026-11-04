import { sortAlgorithms } from "./algorithms";
import { gridSizes, type GridSize } from "./pathfinding/grid";
import { pathSearches } from "./pathfinding/searches";
import type { FourierAlgorithm, FourierShape } from "./fourier/types";
import { graphPresets, graphSizes, type GraphPreset, type GraphSize } from "./graphs/graph";
import type { GraphAlgorithm } from "./graphs/types";
import type { PathAlgorithm } from "./pathfinding/types";
import { routeFromPath } from "./routes";
import { displayModes } from "./consts/displayModes";
import { inputOrders } from "./consts/inputOrders";
import { sizes } from "./consts/sizesMap";
import type { Algorithm, DisplayMode, InputOrder, Size } from "./types";
import { DEFAULT_PRESET, speedPresets, type SpeedPreset } from "./utils/speed";

// Kept in sync with MIN_RACERS / MAX_RACERS in the store (not imported to avoid a cycle).
const MIN_RACERS = 2;
const MAX_RACERS = 4;

/** The settings a link can carry. With the seed, a link reproduces the exact same array. */
export type UrlState = {
  algorithm: Algorithm;
  size: Size;
  inputOrder: InputOrder;
  displayMode: DisplayMode;
  /** Left out of the URL when it's the default. */
  speed?: SpeedPreset;
  seed: number;
  view: "single" | "race";
  raceAlgorithms: Algorithm[];
};

const isOneOf = <T extends string | number>(options: readonly T[], value: unknown): value is T =>
  options.includes(value as T);

/**
 * Reads whatever valid settings the query string has; anything missing or
 * malformed is skipped. `algo` and `view` now live in the path, but old links
 * still carry them, so they're read here too.
 */
export const readUrlState = (search: string): Partial<UrlState> => {
  const params = new URLSearchParams(search);
  const state: Partial<UrlState> = {};

  const algorithm = params.get("algo");
  if (isOneOf(Object.keys(sortAlgorithms) as Algorithm[], algorithm)) state.algorithm = algorithm;

  const size = Number(params.get("size"));
  if (isOneOf(sizes, size)) state.size = size;

  const inputOrder = params.get("input");
  if (isOneOf(Object.keys(inputOrders) as InputOrder[], inputOrder)) state.inputOrder = inputOrder;

  const displayMode = params.get("mode");
  if (isOneOf(displayModes, displayMode)) state.displayMode = displayMode;

  const speed = params.get("speed");
  if (isOneOf(speedPresets, speed)) state.speed = speed;
  // Links from before the presets were all multiples.
  else if (speed === "max") state.speed = "16x";

  const seed = parseInt(params.get("seed") ?? "", 36);
  if (Number.isInteger(seed) && seed >= 0 && seed < 2 ** 32) state.seed = seed;

  const view = params.get("view");
  if (view === "single" || view === "race") state.view = view;

  const algorithms = Object.keys(sortAlgorithms) as Algorithm[];
  const racers = (params.get("race") ?? "").split(",").filter((a) => isOneOf(algorithms, a));
  const unique = algorithms.filter((a) => racers.includes(a));
  if (unique.length >= MIN_RACERS && unique.length <= MAX_RACERS) state.raceAlgorithms = unique;

  return state;
};

/** A pathfinding grid as a link carries it. Cells are validated against the size by the store. */
export type PathUrlState = {
  gridSize?: GridSize;
  /** Terrain, packed (see encodeCells). */
  cells?: string;
  start?: number;
  end?: number;
  /** Who races on the grid, in the picker's order. */
  racers?: PathAlgorithm[];
};

const readPathParams = (params: URLSearchParams): PathUrlState => {
  const state: PathUrlState = {};
  const gridSize = params.get("grid");
  if (isOneOf(gridSizes, gridSize)) state.gridSize = gridSize;
  const cells = params.get("cells");
  if (cells && /^[A-Za-z0-9_-]+$/.test(cells)) state.cells = cells;
  const start = parseInt(params.get("from") ?? "", 36);
  const end = parseInt(params.get("to") ?? "", 36);
  if (Number.isInteger(start) && start >= 0) state.start = start;
  if (Number.isInteger(end) && end >= 0) state.end = end;
  const algorithms = Object.keys(pathSearches) as PathAlgorithm[];
  const racers = (params.get("race") ?? "").split(",");
  const unique = algorithms.filter((a) => racers.includes(a));
  if (unique.length >= MIN_RACERS && unique.length <= MAX_RACERS) state.racers = unique;
  return state;
};

/** The query string for a pathfinding page: the grid, plus the speed if it isn't the default. */
export const toPathSearch = (state: Required<PathUrlState> & { speed?: SpeedPreset }) =>
  "?" +
  new URLSearchParams({
    grid: state.gridSize,
    cells: state.cells,
    from: state.start.toString(36),
    to: state.end.toString(36),
    race: state.racers.join(","),
    ...(state.speed !== undefined && state.speed !== DEFAULT_PRESET && { speed: state.speed }),
  }).toString();

/** A graph as a link carries it: the graph itself, plus the size and kind "new layout" makes. */
export type GraphUrlState = {
  /** Nodes, edges and start, packed (see encodeGraph). Validated by the store. */
  graph?: string;
  size?: GraphSize;
  preset?: GraphPreset;
  /** Who races on the graph, in the picker's order. */
  racers?: GraphAlgorithm[];
};

const readGraphParams = (params: URLSearchParams): GraphUrlState => {
  const state: GraphUrlState = {};
  const graph = params.get("graph");
  if (graph && /^[A-Za-z0-9_-]+$/.test(graph)) state.graph = graph;
  const size = params.get("nodes");
  if (isOneOf(graphSizes, size)) state.size = size;
  const preset = params.get("layout");
  if (isOneOf(graphPresets, preset)) state.preset = preset;
  const algorithms: GraphAlgorithm[] = ["bfs", "dfs", "dijkstra", "prim", "kruskal", "topo"];
  const racers = (params.get("race") ?? "").split(",");
  const unique = algorithms.filter((a) => racers.includes(a));
  if (unique.length >= MIN_RACERS && unique.length <= MAX_RACERS) state.racers = unique;
  return state;
};

/** The query string for a graph page: the graph, its size and kind, plus the speed if it isn't the default. */
export const toGraphSearch = (state: Required<GraphUrlState> & { speed?: SpeedPreset }) =>
  "?" +
  new URLSearchParams({
    graph: state.graph,
    nodes: state.size,
    layout: state.preset,
    race: state.racers.join(","),
    ...(state.speed !== undefined && state.speed !== DEFAULT_PRESET && { speed: state.speed }),
  }).toString();

/** A Fourier run as a link carries it: how many circles, and which drawing (a hand-drawn one packed in `path`). */
export type FourierUrlState = {
  circles?: number;
  shape?: FourierShape;
  path?: string;
};

const fourierShapes: FourierShape[] = ["heart", "star", "infinity", "square", "custom"];

const readFourierParams = (params: URLSearchParams): FourierUrlState => {
  const state: FourierUrlState = {};
  const circles = Number(params.get("circles"));
  if (Number.isInteger(circles) && circles >= 1 && circles <= 256) state.circles = circles;
  const shape = params.get("shape");
  if (isOneOf(fourierShapes, shape)) state.shape = shape;
  const path = params.get("path");
  if (path && /^[A-Za-z0-9_-]+$/.test(path)) state.path = path;
  return state;
};

/** The query string for a Fourier page: circles, the drawing (if any), and the speed if it isn't the default. */
export const toFourierSearch = (state: { circles: number; shape?: FourierShape; path?: string; speed?: SpeedPreset }) =>
  "?" +
  new URLSearchParams({
    circles: String(state.circles),
    ...(state.shape && { shape: state.shape }),
    ...(state.path && { path: state.path }),
    ...(state.speed !== undefined && state.speed !== DEFAULT_PRESET && { speed: state.speed }),
  }).toString();

/** Settings from a full location: the page (path) wins over legacy query parameters. */
export const readLocation = (
  pathname: string,
  search: string,
): Partial<UrlState> & {
  isLanding: boolean;
  isModuleStart: boolean;
  module: "sorting" | "pathfinding" | "graphs" | "fourier";
  pathAlgorithm?: PathAlgorithm;
  path: PathUrlState;
  graphAlgorithm?: GraphAlgorithm;
  graph: GraphUrlState;
  fourierAlgorithm?: FourierAlgorithm;
  fourier: FourierUrlState;
} => {
  const state = readUrlState(search);
  const route = routeFromPath(pathname);
  if (route?.kind === "fourier" || route?.kind === "series") {
    return {
      ...state,
      isLanding: false,
      isModuleStart: route.kind === "fourier",
      module: "fourier",
      view: "single",
      ...(route.kind === "series" && { fourierAlgorithm: route.algorithm }),
      path: {},
      graph: {},
      fourier: readFourierParams(new URLSearchParams(search)),
    };
  }
  if (route?.kind === "graph" || route?.kind === "graphs" || route?.kind === "graphRace") {
    return {
      ...state,
      isLanding: false,
      isModuleStart: route.kind === "graphs",
      module: "graphs",
      view: route.kind === "graphRace" ? "race" : "single",
      ...(route.kind === "graph" && { graphAlgorithm: route.algorithm }),
      path: {},
      graph: readGraphParams(new URLSearchParams(search)),
      fourier: {},
    };
  }
  if (route?.kind === "path" || route?.kind === "pathRace" || route?.kind === "pathfinding") {
    return {
      ...state,
      isLanding: false,
      isModuleStart: route.kind === "pathfinding",
      module: "pathfinding",
      view: route.kind === "pathRace" ? "race" : "single",
      ...(route.kind === "path" && { pathAlgorithm: route.algorithm }),
      path: readPathParams(new URLSearchParams(search)),
      graph: {},
      fourier: {},
    };
  }
  if (route?.kind === "algorithm") {
    state.algorithm = route.algorithm;
    state.view = "single";
  } else if (route?.kind === "race") {
    state.view = "race";
  }
  // Old links put the algorithm in the query string of the home page (/?algo=quick): they open that algorithm.
  const legacy = state.algorithm !== undefined || state.view !== undefined;
  const isLanding = (route === null || route.kind === "home") && !legacy;
  return { ...state, isLanding, isModuleStart: route?.kind === "sorting", module: "sorting", path: {}, graph: {}, fourier: {} };
};

/** The query string for the settings that aren't part of the path. */
export const toSearch = (state: Omit<UrlState, "algorithm" | "view">) =>
  "?" +
  new URLSearchParams({
    size: String(state.size),
    input: state.inputOrder,
    mode: state.displayMode,
    ...(state.speed !== undefined && state.speed !== DEFAULT_PRESET && { speed: state.speed }),
    seed: state.seed.toString(36),
    race: state.raceAlgorithms.join(","),
  }).toString();
