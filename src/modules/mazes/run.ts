import { seededRandom } from "@/utils/random";
import { hasStartCell, mazeGenerators, startCell } from "@/utils/mazeGenerators";
import {
  CARVED,
  DEAD_END,
  FRONTIER,
  ACTIVE,
  OTHER_REGION,
  REGION,
  SKIPPED,
  STACK,
  WALK,
  WALL,
  type MazeAlgorithm,
  type MazeCellState,
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
   * The cells this step's move shows (ACTIVE, Kruskal's regions), each with the state it settles
   * into from the next step on.
   */
  active: { cell: number; then: MazeCellState }[];
  /** The wall Kruskal skipped this step, a wall again from the next step on. */
  skipped: number | null;
};

// A full copy every few hundred steps keeps seeking instant, like pathfinding.
const CHECKPOINT_EVERY = 256;

const clone = (s: State): State => ({ ...s, states: s.states.slice(), active: s.active.slice() });

/** Shows `cell` as `state` for this step only, then as `then`. */
const show = (s: State, cell: number, state: MazeCellState, then: MazeCellState) => {
  s.states[cell] = state;
  s.active.push({ cell, then });
};

/** Shows `cell` as this step's move, then as `then`. */
const activate = (s: State, cell: number, then: MazeCellState) => show(s, cell, ACTIVE, then);

const apply = (s: State, step: MazeStep) => {
  s.line = step.line;
  // Marking the dead ends is the wrap-up, not a decision.
  if (step.type !== "done") s.steps++;
  for (const { cell, then } of s.active) s.states[cell] = then;
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
      activate(s, step.wall, CARVED);
      activate(s, step.cell, CARVED);
      for (const cell of step.frontier) s.states[cell] = FRONTIER;
      s.current = step.cell;
      break;
    case "regions":
      for (const cell of step.cells) s.states[cell] = CARVED;
      break;
    case "join": {
      const [region, other] = step.regions;
      for (const cell of region) show(s, cell, REGION, CARVED);
      for (const cell of other) show(s, cell, OTHER_REGION, CARVED);
      activate(s, step.wall, CARVED);
      break;
    }
    case "skip":
      for (const cell of step.region) show(s, cell, REGION, CARVED);
      s.states[step.wall] = SKIPPED;
      s.skipped = step.wall;
      break;
    case "first":
      s.states[step.cell] = CARVED;
      s.current = step.cell;
      break;
    case "walkStart":
      activate(s, step.cell, WALK);
      s.current = step.cell;
      break;
    case "walk":
      activate(s, step.wall, WALK);
      activate(s, step.cell, step.to === "maze" ? CARVED : WALK);
      s.current = step.cell;
      break;
    case "erase":
      for (const cell of step.erased) s.states[cell] = WALL;
      s.current = step.cell;
      break;
    case "carveWalk":
      for (const cell of step.carved) s.states[cell] = CARVED;
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
    const start = startCell(grid, random);
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
