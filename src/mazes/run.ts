import { seededRandom } from "@/utils/random";
import { hasStartCell, mazeCells, mazeGenerators } from "./generators";
import {
  CARVED,
  DEAD_END,
  FRONTIER,
  ACTIVE,
  OTHER_REGION,
  REGION,
  SKIPPED,
  STACK,
  WALL,
  type MazeAlgorithm,
  type MazeFrame,
  type MazeGrid,
  type MazeStep,
} from "./types";

type State = {
  states: Uint8Array;
  current: number | null;
  line: number | null;
  steps: number;
  deadEnds: number | null;
  /**
   * The cells this step's move shows (ACTIVE, Kruskal's regions), carved like the rest from the
   * next step on.
   */
  active: number[];
  /** The wall Kruskal skipped this step, a wall again from the next step on. */
  skipped: number | null;
};

// A full copy every few hundred steps keeps seeking instant, like pathfinding.
const CHECKPOINT_EVERY = 256;

const clone = (s: State): State => ({ ...s, states: s.states.slice(), active: s.active.slice() });

const apply = (s: State, step: MazeStep) => {
  s.line = step.line;
  // Marking the dead ends is the wrap-up, not a decision.
  if (step.type !== "done") s.steps++;
  for (const cell of s.active) s.states[cell] = CARVED;
  s.active = [];
  if (s.skipped !== null) s.states[s.skipped] = WALL;
  s.skipped = null;
  switch (step.type) {
    case "start":
      if (step.frontier) {
        s.states[step.cell] = CARVED;
        for (const cell of step.frontier) s.states[cell] = FRONTIER;
      } else s.states[step.cell] = STACK;
      s.current = step.cell;
      break;
    case "pick":
      s.states[step.wall] = ACTIVE;
      s.states[step.cell] = ACTIVE;
      s.active = [step.wall, step.cell];
      for (const cell of step.frontier) s.states[cell] = FRONTIER;
      s.current = step.cell;
      break;
    case "regions":
      for (const cell of step.cells) s.states[cell] = CARVED;
      break;
    case "join": {
      const [region, other] = step.regions;
      for (const cell of region) s.states[cell] = REGION;
      for (const cell of other) s.states[cell] = OTHER_REGION;
      s.states[step.wall] = ACTIVE;
      s.active = [...region, ...other, step.wall];
      break;
    }
    case "skip":
      for (const cell of step.region) s.states[cell] = REGION;
      s.states[step.wall] = SKIPPED;
      s.active = step.region.slice();
      s.skipped = step.wall;
      break;
    case "carve":
      s.states[step.wall] = STACK;
      s.states[step.cell] = STACK;
      s.current = step.cell;
      break;
    case "backtrack":
      s.states[step.cell] = CARVED;
      if (step.wall !== null) {
        s.states[step.wall] = CARVED;
        // Back where the passage came from.
        s.current = 2 * step.wall - step.cell;
      } else s.current = null;
      break;
    case "done":
      for (const cell of step.deadEnds) s.states[cell] = DEAD_END;
      s.deadEnds = step.deadEnds.length;
      s.current = null;
      break;
  }
};

/** The start cell a seed picks: the first draw of its random source, so every generator on the seed starts there. */
const startOf = (grid: MazeGrid, random: () => number) => {
  const cells = mazeCells(grid);
  return cells[Math.floor(random() * cells.length)];
};

/** A whole maze being carved, recorded up front: frame i is the grid after i decisions. */
export class MazeRun {
  readonly length: number;
  readonly rows: number;
  readonly cols: number;
  /** Where carving starts, picked by the seed; null for a generator that has no start cell. */
  readonly start: number | null;
  private readonly steps: MazeStep[] = [];
  private readonly checkpoints: State[] = [];
  private cursor: { index: number; state: State };
  private cache = new Map<number, MazeFrame>();

  constructor(
    readonly algorithm: MazeAlgorithm,
    grid: MazeGrid,
    readonly seed: number,
  ) {
    this.rows = grid.rows;
    this.cols = grid.cols;
    const random = seededRandom(seed);
    // Kruskal never uses its start cell, but drawing it keeps the seed's other random choices aligned with the rest.
    const start = startOf(grid, random);
    this.start = hasStartCell[algorithm] ? start : null;
    const initial: State = {
      states: new Uint8Array(grid.rows * grid.cols),
      current: null,
      line: null,
      steps: 0,
      deadEnds: null,
      active: [],
      skipped: null,
    };
    const working = clone(initial);
    this.checkpoints.push(clone(initial));
    for (const step of mazeGenerators[algorithm](grid, start, random)) {
      this.steps.push(step);
      apply(working, step);
      if (this.steps.length % CHECKPOINT_EVERY === 0) this.checkpoints.push(clone(working));
    }
    this.length = this.steps.length + 1;
    this.cursor = { index: 0, state: clone(initial) };
  }

  frameAt(index: number): MazeFrame {
    const i = Math.min(Math.max(index, 0), this.length - 1);
    const cached = this.cache.get(i);
    if (cached) return cached;
    const { cursor } = this;
    if (i < cursor.index || i - cursor.index > CHECKPOINT_EVERY) {
      const k = Math.floor(i / CHECKPOINT_EVERY);
      cursor.index = k * CHECKPOINT_EVERY;
      cursor.state = clone(this.checkpoints[k]);
    }
    while (cursor.index < i) apply(cursor.state, this.steps[cursor.index++]);
    const s = cursor.state;
    const frame: MazeFrame = {
      states: s.states.slice(),
      current: s.current,
      line: s.line,
      stats: { steps: s.steps, deadEnds: s.deadEnds },
    };
    if (this.cache.size >= 8) this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(i, frame);
    return frame;
  }

  /** The step that leads from frame `index - 1` to frame `index`. */
  stepAt(index: number): MazeStep | null {
    return index > 0 && index < this.length ? this.steps[index - 1] : null;
  }
}
