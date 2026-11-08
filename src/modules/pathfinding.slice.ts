import type { View } from "@/appStore";
import {
  applyPreset,
  decodeCells,
  emptyGrid,
  encodeCells,
  gridDimensions,
  gridSizes,
  pathSearches,
  PathTimeline,
  type Grid,
  type GridSize,
  type PathAlgorithm,
  type Preset,
} from "@/pathfinding";
import { toPathSearch } from "@/urlState";
import { newSeed, seededRandom } from "@/utils/random";
import { PATH_STEP_WEIGHT } from "@/utils/speed";
import { defineModule, isNarrow, toggleRacer, withRacer, type Link, type SliceContext } from "./slice";

/** What dragging on the grid paints. */
export type Brush = "wall" | "mud";

export type PathfindingState = {
  algorithm: PathAlgorithm;
  gridSize: GridSize;
  grid: Grid;
  /** The last preset applied, so "new maze" (R) makes another of the same kind. */
  gridPreset: Preset;
  brush: Brush;
  /** The whole search on the current grid, precomputed. */
  run: PathTimeline;
  /** Searches racing on the grid, in the picker's order. */
  racers: PathAlgorithm[];
  /** One run per racer, on the current grid. Empty outside race view. */
  raceRuns: PathTimeline[];
  /** Bumped when the grid is replaced wholesale (size, preset), so cells don't animate between layouts. */
  inputId: number;
};

// Two that guarantee a shortest path, one that aims for the target, one that doesn't: the classic comparison.
const DEFAULT_RACERS: PathAlgorithm[] = ["bfs", "dijkstra", "astar", "greedy"];
const ORDER = Object.keys(pathSearches) as PathAlgorithm[];

const runFor = (algorithm: PathAlgorithm, grid: Grid) => new PathTimeline(pathSearches[algorithm], grid);

const raceRunsFor = (view: View, racers: PathAlgorithm[], grid: Grid) =>
  view === "race" ? racers.map((a) => runFor(a, grid)) : [];

/** Race lanes are a quarter of the stage, so bigger grids get too small to follow. */
export const raceMaxGridSize = (isMobile: boolean): GridSize => (isMobile ? "small" : "medium");

/** The grid size to use: the one asked for, capped in a race. */
const fitGridSize = (size: GridSize, view: View, isMobile: boolean) => {
  const cap = raceMaxGridSize(isMobile);
  return view === "race" && gridSizes.indexOf(size) > gridSizes.indexOf(cap) ? cap : size;
};

/** A fresh grid of the given size with a preset applied. */
const gridFor = (size: GridSize, narrow: boolean, preset: Preset) => {
  const { rows, cols } = gridDimensions(size, narrow);
  return applyPreset(emptyGrid(rows, cols), preset, seededRandom(newSeed()));
};

/** The grid a link describes, if it's valid for the size; otherwise a fresh maze. */
const gridFromLink = (link: Link["path"], size: GridSize, narrow: boolean) => {
  const { rows, cols } = gridDimensions(size, narrow);
  const cells = link.cells ? decodeCells(link.cells, rows * cols) : null;
  const inside = (cell: number | undefined): cell is number => cell !== undefined && cell < rows * cols;
  if (!cells || !inside(link.start) || !inside(link.end) || link.start === link.end)
    return gridFor(size, narrow, "maze");
  cells[link.start] = 0;
  cells[link.end] = 0;
  return { rows, cols, cells, start: link.start, end: link.end };
};

/** Every search on a grid, after it changes: the single run and the racers. */
const runsFor = (s: PathfindingState, ctx: SliceContext, grid: Grid) => ({
  grid,
  run: runFor(s.algorithm, grid),
  raceRuns: raceRunsFor(ctx.view, s.racers, grid),
});

/** A new grid of the asked size (fitted to the view), with the last preset. */
const resized = (s: PathfindingState, ctx: SliceContext, requested: GridSize) => {
  const gridSize = fitGridSize(requested, ctx.view, ctx.isMobile);
  const grid = gridFor(gridSize, isNarrow(ctx), s.gridPreset);
  return { gridSize, inputId: s.inputId + 1, ...runsFor(s, ctx, grid) };
};

const withPreset = (s: PathfindingState, ctx: SliceContext, gridPreset: Preset) => ({
  gridPreset,
  inputId: s.inputId + 1,
  ...runsFor(s, ctx, applyPreset(s.grid, gridPreset, seededRandom(newSeed()))),
});

export const pathfindingSlice = defineModule<PathfindingState, PathAlgorithm>()({
  tourKey: "tour-done-pathfinding",

  hydrate: (link, ctx) => {
    const algorithm = link.pathAlgorithm ?? "astar";
    const gridSize = fitGridSize(link.path.gridSize ?? (ctx.isMobile ? "small" : "medium"), ctx.view, ctx.isMobile);
    const grid = gridFromLink(link.path, gridSize, isNarrow(ctx));
    const racers = link.path.racers ?? DEFAULT_RACERS;
    return {
      algorithm,
      gridSize,
      grid,
      gridPreset: "maze",
      brush: "wall",
      run: runFor(algorithm, grid),
      racers,
      raceRuns: raceRunsFor(ctx.view, racers, grid),
      inputId: 0,
    };
  },

  current: (s) => s.algorithm,

  // The grid stays the same so algorithms can be compared on it.
  pick: (s, _, algorithm) => ({ algorithm, run: runFor(algorithm, s.grid) }),

  actions: {
    setGridSize: (s, ctx, size: GridSize) => resized(s, ctx, size),
    /** Replaces the grid after an edit (painting, moving a marker); the search restarts. */
    editGrid: (s, ctx, grid: Grid) => runsFor(s, ctx, grid),
    applyGridPreset: (s, ctx, preset: Preset) => withPreset(s, ctx, preset),
    toggleRacer: (s, ctx, racer: PathAlgorithm) => {
      const racers = toggleRacer(ORDER, s.racers, racer);
      return racers && { racers, raceRuns: raceRunsFor(ctx.view, racers, s.grid) };
    },
  },

  settings: {
    setBrush: (_s: PathfindingState, _: SliceContext, brush: Brush) => ({ brush }),
  },

  addRacer: (s, racer) => ({ racers: withRacer(ORDER, s.racers, racer) }),

  // A big grid gets a fresh layout at the largest size a race shows well.
  forView: (s, ctx) =>
    fitGridSize(s.gridSize, ctx.view, ctx.isMobile) === s.gridSize
      ? { raceRuns: raceRunsFor(ctx.view, s.racers, s.grid) }
      : resized(s, ctx, s.gridSize),

  // Upright grids for narrow screens, wide ones otherwise.
  reshape: (s, ctx) => resized(s, ctx, s.gridSize),

  // "New" means another layout of the same kind (a clear grid becomes a maze).
  newInput: (s, ctx) => withPreset(s, ctx, s.gridPreset === "clear" ? "maze" : s.gridPreset),

  engine: {
    // Races run on cells examined, so every lane gets the same clock.
    lastIndex: (s, view) =>
      view === "race" ? Math.max(0, ...s.raceRuns.map((t) => t.totalVisits)) : s.run.length - 1,
    stepWeight: (s, index) => PATH_STEP_WEIGHT[s.run.stepAt(index)?.type ?? "done"],
    pace: (view) => (view === "race" ? "pathRace" : "pathfinding"),
    route: (s, ctx) => {
      if (ctx.view === "race") return { kind: "pathRace" };
      return ctx.isModuleStart ? { kind: "pathfinding" } : { kind: "path", algorithm: s.algorithm };
    },
    search: (s, ctx) =>
      toPathSearch({
        gridSize: s.gridSize,
        cells: encodeCells(s.grid.cells),
        start: s.grid.start,
        end: s.grid.end,
        racers: s.racers,
        speed: ctx.speedPreset,
      }),
  },
});
