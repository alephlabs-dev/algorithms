import type { StageView } from "@/appStore";
import { applyPreset, decodeCells, emptyGrid, encodeCells, gridFromMaze, type Preset } from "./grid";
import type { CarvedMaze } from "@/utils/mazeGenerators";
import { PATH_ALGORITHMS, pathSearches } from "./searches";
import { PathTimeline, type PathStepKind } from "./timeline";
import type { Grid, PathAlgorithm } from "./types";
import {
  fitGridSize,
  gridSizes,
  MIN_PHONE_ROWS,
  sizeForView,
  stageGridDimensions,
  type GridSize,
} from "@/utils/gridSize";
import { questionsOf } from "@/game";
import { pathQuestions } from "./questions";
import { localized } from "@/i18n";
import { pathfindingLink, type PathfindingLink } from "./link";
import { newSeed, seededRandom } from "@/utils/random";
import { defineModule, toggleRacer, withRacer, type SliceContext } from "@/modules/slice";
import { sentences } from "./sentences";

/** What dragging on the grid paints. */
export type Brush = "wall" | "mud";

export type PathfindingState = {
  algorithm: PathAlgorithm;
  gridSize: GridSize;
  /** The size the learner had before a race capped it, given back when the race ends; null otherwise. */
  gridSizeBeforeRace: GridSize | null;
  /**
   * The grid on stage before a race shrank it, given back with its size when the race ends, unless
   * the learner changed the size, the preset or the grid during it; null otherwise.
   */
  gridBeforeRace: { grid: Grid; keepShape: boolean } | null;
  grid: Grid;
  /**
   * The grid came from a link or the learner painted it, so a phone's stage changing shape
   * keeps it (its rows can then differ from what the stage holds). A generated grid is laid out again.
   */
  keepShape: boolean;
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
  /**
   * How big a cell is on screen, in CSS pixels, with guess mode's panel under the stage;
   * null until the stage has been measured. Guess mode needs room for a letter in a cell.
   */
  cellSize: number | null;
  /** The screen's device pixels per CSS pixel when the stage was measured: sharp screens read smaller letters. */
  pixelRatio: number;
};

/**
 * Guess mode marks cells with letters (bold, at least 11px, on a badge), readable from this
 * many CSS pixels a cell: 14 on sharp screens (2× and up), 16 on others. The buttons under
 * the stage are the main way to answer; tapping a cell is a bonus.
 */
export const guessMinCell = (pixelRatio: number) => (pixelRatio >= 2 ? 14 : 16);

const guessText = localized({
  en: {
    pickSmaller: "Guess needs bigger cells: pick a smaller grid",
    screenTooSmall: "Guess needs bigger cells than fit on this screen",
  },
  es: {
    pickSmaller: "Adivina necesita celdas más grandes: elige una cuadrícula más pequeña",
    screenTooSmall: "Adivina necesita celdas más grandes de las que caben en esta pantalla",
  },
});

/** Why guess mode can't play: its letters don't fit in cells this small. Null when they do, or before measuring. */
const cellsTooSmall = (s: PathfindingState) => {
  if (s.cellSize === null || s.cellSize >= guessMinCell(s.pixelRatio)) return null;
  return s.gridSize === gridSizes[0] ? guessText.screenTooSmall : guessText.pickSmaller;
};

/**
 * Share of a beat each kind of step takes: each visit gets a beat, frontier updates
 * follow quickly, and the final path traces fast so it reads as one stroke.
 */
const STEP_WEIGHT: Record<PathStepKind, number> = {
  visit: 1,
  frontier: 0.4,
  path: 0.3,
  done: 1,
};

// Two that guarantee a shortest path, one that aims for the target, one that doesn't: the classic comparison.
const DEFAULT_RACERS: PathAlgorithm[] = ["bfs", "dijkstra", "astar", "greedy"];

const runFor = (algorithm: PathAlgorithm, grid: Grid) => new PathTimeline(pathSearches[algorithm], grid);

const raceRunsFor = (view: StageView, racers: PathAlgorithm[], grid: Grid) =>
  view === "race" ? racers.map((a) => runFor(a, grid)) : [];


/** A fresh grid of the given size, laid out for the screen, with a preset applied. */
const gridFor = (size: GridSize, ctx: SliceContext, preset: Preset) => {
  const { rows, cols } = stageGridDimensions(size, ctx);
  return applyPreset(emptyGrid(rows, cols), preset, seededRandom(newSeed()));
};

/** The rows a size has before any stage is measured: a link without its own rows has these. */
const usualRows = (size: GridSize, ctx: SliceContext) => stageGridDimensions(size, { ...ctx, stageAspect: null }).rows;

/**
 * How many rows a link's grid has: on a phone, the ones the link names (they follow the stage
 * it was made on), if odd and not too few; otherwise the size's usual rows.
 */
const linkRows = (link: PathfindingLink, size: GridSize, ctx: SliceContext) => {
  const named = link.rows;
  return ctx.isMobile && named !== undefined && named % 2 === 1 && named >= MIN_PHONE_ROWS ? named : usualRows(size, ctx);
};

/** The grid a link describes, if it's valid for the size; otherwise a fresh maze. */
const gridFromLink = (link: PathfindingLink, size: GridSize, ctx: SliceContext): { grid: Grid; keepShape: boolean } => {
  const { cols } = stageGridDimensions(size, ctx);
  const rows = linkRows(link, size, ctx);
  const cells = link.cells ? decodeCells(link.cells, rows * cols) : null;
  const inside = (cell: number | undefined): cell is number => cell !== undefined && cell < rows * cols;
  if (!cells || !inside(link.start) || !inside(link.end) || link.start === link.end)
    return { grid: gridFor(size, ctx, "maze"), keepShape: false };
  cells[link.start] = 0;
  cells[link.end] = 0;
  return { grid: { rows, cols, cells, start: link.start, end: link.end }, keepShape: true };
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
  const grid = gridFor(gridSize, ctx, s.gridPreset);
  return { gridSize, keepShape: false, gridBeforeRace: null, inputId: s.inputId + 1, ...runsFor(s, ctx, grid) };
};

/** A whole grid and its size put on stage at once (one remembered from before a race, a maze from Mazes). */
const withGrid = (s: PathfindingState, ctx: SliceContext, gridSize: GridSize, grid: Grid, keepShape: boolean) => ({
  gridSize,
  keepShape,
  gridBeforeRace: null,
  inputId: s.inputId + 1,
  ...runsFor(s, ctx, grid),
});

/** Whether a grid fits the stage: its shape, or on a phone any rows for a grid the learner opened or painted. */
const fitsStage = (grid: Grid, keepShape: boolean, gridSize: GridSize, ctx: SliceContext) => {
  const { rows, cols } = stageGridDimensions(gridSize, ctx);
  return grid.cols === cols && (grid.rows === rows || (ctx.isMobile && keepShape));
};

/** Fits the stage: the grid's own shape when the stage holds one like it, a fresh grid's otherwise. */
const withPreset = (s: PathfindingState, ctx: SliceContext, gridPreset: Preset) => {
  const { rows, cols } = stageGridDimensions(s.gridSize, ctx);
  const base = s.grid.rows === rows && s.grid.cols === cols ? s.grid : emptyGrid(rows, cols);
  return {
    gridPreset,
    keepShape: false,
    gridBeforeRace: null,
    inputId: s.inputId + 1,
    ...runsFor(s, ctx, applyPreset(base, gridPreset, seededRandom(newSeed()))),
  };
};

export const pathfindingSlice = defineModule<PathfindingState, PathAlgorithm, PathfindingLink>()({
  sentences,

  link: pathfindingLink,
  hydrate: (link, ctx) => {
    const algorithm = link.algorithm ?? "astar";
    const requested = link.params.gridSize ?? (ctx.isMobile ? "small" : "medium");
    const { size: gridSize, beforeRace } = sizeForView(requested, null, ctx.view, ctx.isMobile);
    const { grid, keepShape } = gridFromLink(link.params, gridSize, ctx);
    const racers = link.params.racers ?? DEFAULT_RACERS;
    return {
      algorithm,
      gridSize,
      gridSizeBeforeRace: beforeRace,
      gridBeforeRace: null,
      grid,
      keepShape,
      gridPreset: "maze",
      brush: "wall",
      run: runFor(algorithm, grid),
      racers,
      raceRuns: raceRunsFor(ctx.view, racers, grid),
      inputId: 0,
      cellSize: null,
      pixelRatio: 1,
    };
  },

  current: (s) => s.algorithm,

  // The grid stays the same so algorithms can be compared on it.
  pick: (s, _, algorithm) => ({ algorithm, run: runFor(algorithm, s.grid) }),

  actions: {
    // A size picked during a race is the learner's choice from then on.
    setGridSize: (s, ctx, size: GridSize) => ({ ...resized(s, ctx, size), gridSizeBeforeRace: null }),
    /** Replaces the grid after an edit (painting, moving a marker); the search restarts. */
    editGrid: (s, ctx, grid: Grid) => ({ ...runsFor(s, ctx, grid), keepShape: true, gridBeforeRace: null }),
    /**
     * Puts a finished maze from Mazes on stage at its size: walls where it left walls, start and
     * end in opposite corner cells of the maze, so it stays perfect (one way through).
     */
    openMaze: (s, ctx, maze: CarvedMaze, gridSize: GridSize) => ({
      ...withGrid(s, ctx, gridSize, gridFromMaze(maze), true),
      gridSizeBeforeRace: null,
    }),
    applyGridPreset: (s, ctx, preset: Preset) => withPreset(s, ctx, preset),
    toggleRacer: (s, ctx, racer: PathAlgorithm) => {
      const racers = toggleRacer(PATH_ALGORITHMS, s.racers, racer);
      return racers && { racers, raceRuns: raceRunsFor(ctx.view, racers, s.grid) };
    },
  },

  settings: {
    setBrush: (_s: PathfindingState, _: SliceContext, brush: Brush) => ({ brush }),
    /** The stage reports its cell size whenever it changes, so guess mode knows whether letters fit. */
    setCellSize: (_s: PathfindingState, _: SliceContext, cellSize: number, pixelRatio: number) => ({
      cellSize,
      pixelRatio,
    }),
  },

  addRacer: (s, racer) => ({ racers: withRacer(PATH_ALGORITHMS, s.racers, racer) }),

  // A big grid gets a fresh layout at the largest size a race shows well, and the learner's
  // grid is kept aside; leaving the race gives it back, or lays one out again at the size from
  // before if it was changed during the race.
  forView: (s, ctx) => {
    const { size, beforeRace } = sizeForView(s.gridSize, s.gridSizeBeforeRace, ctx.view, ctx.isMobile);
    if (size === s.gridSize) return { gridSizeBeforeRace: beforeRace, raceRuns: raceRunsFor(ctx.view, s.racers, s.grid) };
    const kept = s.gridBeforeRace;
    if (ctx.view === "single" && kept && fitsStage(kept.grid, kept.keepShape, size, ctx))
      return { ...withGrid(s, ctx, size, kept.grid, kept.keepShape), gridSizeBeforeRace: beforeRace };
    return {
      ...resized(s, ctx, size),
      gridSizeBeforeRace: beforeRace,
      gridBeforeRace: ctx.view === "race" ? { grid: s.grid, keepShape: s.keepShape } : null,
    };
  },

  // Upright grids for narrow screens, wide ones otherwise, and a phone's as tall as its stage
  // holds. A phone keeps a grid it opened or painted while its columns still fit.
  // A grid kept aside for after a race stays kept: the screen changed, not the learner's grid.
  fit: (s, ctx) =>
    fitsStage(s.grid, s.keepShape, s.gridSize, ctx)
      ? null
      : { ...resized(s, ctx, s.gridSize), gridBeforeRace: s.gridBeforeRace },

  // "New" means another layout of the same kind (a clear grid becomes a maze).
  newInput: (s, ctx) => withPreset(s, ctx, s.gridPreset === "clear" ? "maze" : s.gridPreset),

  engine: {
    // Races run on cells examined, so every lane gets the same clock.
    lastIndex: (s, view) =>
      view === "race" ? Math.max(0, ...s.raceRuns.map((t) => t.totalVisits)) : s.run.length - 1,
    stepWeight: (s, index) => STEP_WEIGHT[s.run.stepAt(index)?.type ?? "done"],
    pace: () => 20,
    game: (s) => questionsOf(s.run, (run) => pathQuestions(run, s.algorithm)),
    // Enabled by how big cells are on screen, not by grid size: a big grid on a big screen still has room.
    gameUnavailable: cellsTooSmall,
    search: (s, ctx) =>
      pathfindingLink.write(
        {
          gridSize: s.gridSize,
          cells: encodeCells(s.grid.cells),
          rows: s.grid.rows === usualRows(s.gridSize, ctx) ? undefined : s.grid.rows,
          start: s.grid.start,
          end: s.grid.end,
          racers: s.racers,
        },
        ctx.speedPreset,
      ),
  },
});
