import type { View } from "@/appStore";
import { MAZE_ALGORITHMS, MazeRun, type MazeAlgorithm, type MazeStep } from "@/mazes";
import { fitGridSize, gridDimensions, type GridSize } from "@/pathfinding/grid";
import { newSeed } from "@/utils/random";
import { mazesLink, type MazesLink } from "./mazes.link";
import { defineModule, isNarrow, toggleRacer, withRacer, type SliceContext } from "./slice";

export type MazesState = {
  algorithm: MazeAlgorithm;
  size: GridSize;
  /** The only randomness in a run: it picks the start cell and every random choice. */
  seed: number;
  /** The whole carve, precomputed. */
  run: MazeRun;
  /** Generators carving the seed side by side, in the picker's order. */
  racers: MazeAlgorithm[];
  /** One run per racer, on the same seed and size. Empty outside race view. */
  raceRuns: MazeRun[];
  /** Bumped when the grid is replaced wholesale (size, seed, layout), so cells snap instead of animating. */
  inputId: number;
};

// All four: the race is about comparing every texture on one seed.
const DEFAULT_RACERS: MazeAlgorithm[] = [...MAZE_ALGORITHMS];

/** The same grid dimensions as pathfinding, upright on narrow screens. */
const runFor = (algorithm: MazeAlgorithm, size: GridSize, seed: number, ctx: SliceContext) =>
  new MazeRun(algorithm, gridDimensions(size, isNarrow(ctx)), seed);

const raceRunsFor = (view: View, racers: MazeAlgorithm[], size: GridSize, seed: number, ctx: SliceContext) =>
  view === "race" ? racers.map((a) => runFor(a, size, seed, ctx)) : [];

/** A new size or seed: the single run and the racers carve it again. A race caps the size. */
const withRun = (s: MazesState, ctx: SliceContext, change: Partial<Pick<MazesState, "size" | "seed">>) => {
  const seed = change.seed ?? s.seed;
  const size = fitGridSize(change.size ?? s.size, ctx.view, ctx.isMobile);
  return {
    ...change,
    size,
    run: runFor(s.algorithm, size, seed, ctx),
    raceRuns: raceRunsFor(ctx.view, s.racers, size, seed, ctx),
    inputId: s.inputId + 1,
  };
};

/**
 * Backtracks retreat quickly, so the carving reads as the beat. Kruskal's skips stay a full beat,
 * so they're noticed. Wilson's walk steps hurry, so its long first walk plays in full (never cut)
 * while erasing a loop and carving the walk in read as the beat.
 */
const STEP_WEIGHT: Record<MazeStep["type"], number> = {
  start: 1,
  carve: 1,
  backtrack: 0.5,
  pick: 1,
  regions: 1,
  join: 1,
  skip: 1,
  first: 1,
  walkStart: 1,
  walk: 0.6,
  erase: 1,
  carveWalk: 1,
  done: 1,
};

export const mazesSlice = defineModule<MazesState, MazeAlgorithm, MazesLink>()({
  tourKey: "tour-done-mazes",

  link: mazesLink,
  // A broken or missing seed carves a fresh maze.
  hydrate: (link, ctx) => {
    const algorithm = link.algorithm ?? "dfs";
    const size = fitGridSize(link.params.size ?? (ctx.isMobile ? "small" : "medium"), ctx.view, ctx.isMobile);
    const seed = link.params.seed ?? newSeed();
    const racers = link.params.racers ?? DEFAULT_RACERS;
    return {
      algorithm,
      size,
      seed,
      run: runFor(algorithm, size, seed, ctx),
      racers,
      raceRuns: raceRunsFor(ctx.view, racers, size, seed, ctx),
      inputId: 0,
    };
  },

  current: (s) => s.algorithm,

  // The seed stays, so algorithms carve from the same start.
  pick: (s, ctx, algorithm) => ({ algorithm, run: runFor(algorithm, s.size, s.seed, ctx) }),

  actions: {
    setSize: (s, ctx, size: GridSize) => withRun(s, ctx, { size }),
    toggleRacer: (s, ctx, racer: MazeAlgorithm) => {
      const racers = toggleRacer(MAZE_ALGORITHMS, s.racers, racer);
      return racers && { racers, raceRuns: raceRunsFor(ctx.view, racers, s.size, s.seed, ctx) };
    },
  },

  addRacer: (s, racer) => ({ racers: withRacer(MAZE_ALGORITHMS, s.racers, racer) }),

  // A large maze is carved again at the largest size a race shows well, from the same seed.
  forView: (s, ctx) =>
    fitGridSize(s.size, ctx.view, ctx.isMobile) === s.size
      ? { raceRuns: raceRunsFor(ctx.view, s.racers, s.size, s.seed, ctx) }
      : withRun(s, ctx, {}),

  // Upright grids for narrow screens, wide ones otherwise; the same seed carves them.
  fit: (s, ctx) => {
    const { rows, cols } = gridDimensions(s.size, isNarrow(ctx));
    return s.run.rows === rows && s.run.cols === cols ? null : withRun(s, ctx, {});
  },

  // "New maze": another seed, the same size.
  newInput: (s, ctx) => withRun(s, ctx, { seed: newSeed() }),

  engine: {
    // Every racer takes one decision per tick, so the clock runs until the longest carve is done.
    lastIndex: (s, view) =>
      view === "race" ? Math.max(0, ...s.raceRuns.map((r) => r.length - 1)) : s.run.length - 1,
    stepWeight: (s, index) => STEP_WEIGHT[s.run.stepAt(index)?.type ?? "done"],
    pace: (view) => (view === "race" ? "mazeRace" : "mazes"),
    search: (s, ctx) =>
      mazesLink.write(
        {
          size: s.size,
          seed: s.seed,
          // All four is the default, so links from before the race stay as they were.
          racers: s.racers.length === DEFAULT_RACERS.length ? undefined : s.racers,
        },
        ctx.speedPreset,
      ),
  },
});
