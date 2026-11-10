import { MazeRun, type MazeAlgorithm, type MazeStep } from "@/mazes";
import { gridDimensions, type GridSize } from "@/pathfinding/grid";
import { newSeed } from "@/utils/random";
import { mazesLink, type MazesLink } from "./mazes.link";
import { defineModule, isNarrow, type SliceContext } from "./slice";

export type MazesState = {
  algorithm: MazeAlgorithm;
  size: GridSize;
  /** The only randomness in a run: it picks the start cell and every random choice. */
  seed: number;
  /** The whole carve, precomputed. */
  run: MazeRun;
  /** Bumped when the grid is replaced wholesale (size, seed, layout), so cells snap instead of animating. */
  inputId: number;
};

/** The same grid dimensions as pathfinding, upright on narrow screens. */
const runFor = (algorithm: MazeAlgorithm, size: GridSize, seed: number, ctx: SliceContext) =>
  new MazeRun(algorithm, gridDimensions(size, isNarrow(ctx)), seed);

const withRun = (s: MazesState, ctx: SliceContext, change: Partial<Pick<MazesState, "size" | "seed">>) => {
  const { size, seed } = { ...s, ...change };
  return { ...change, run: runFor(s.algorithm, size, seed, ctx), inputId: s.inputId + 1 };
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
    const size = link.params.size ?? (ctx.isMobile ? "small" : "medium");
    const seed = link.params.seed ?? newSeed();
    return { algorithm, size, seed, run: runFor(algorithm, size, seed, ctx), inputId: 0 };
  },

  current: (s) => s.algorithm,

  // The seed stays, so algorithms carve from the same start.
  pick: (s, ctx, algorithm) => ({ algorithm, run: runFor(algorithm, s.size, s.seed, ctx) }),

  actions: {
    setSize: (s, ctx, size: GridSize) => withRun(s, ctx, { size }),
  },

  // Upright grids for narrow screens, wide ones otherwise; the same seed carves them.
  fit: (s, ctx) => {
    const { rows, cols } = gridDimensions(s.size, isNarrow(ctx));
    return s.run.rows === rows && s.run.cols === cols ? null : withRun(s, ctx, {});
  },

  // "New maze": another seed, the same size.
  newInput: (s, ctx) => withRun(s, ctx, { seed: newSeed() }),

  engine: {
    lastIndex: (s) => s.run.length - 1,
    stepWeight: (s, index) => STEP_WEIGHT[s.run.stepAt(index)?.type ?? "done"],
    pace: () => "mazes",
    search: (s, ctx) => mazesLink.write({ size: s.size, seed: s.seed }, ctx.speedPreset),
  },
});
