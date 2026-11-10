import { seededRandom } from "@/utils/random";
import { mazeCells, mazeGenerators } from "./generators";
import {
  CARVED,
  DEAD_END,
  FRONTIER,
  PICKED,
  STACK,
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
  /** The cells PICKED shows: the last pick and its wall, carved like the rest from the next step on. */
  picked: number[];
};

// A full copy every few hundred steps keeps seeking instant, like pathfinding.
const CHECKPOINT_EVERY = 256;

const clone = (s: State): State => ({ ...s, states: s.states.slice(), picked: s.picked.slice() });

const apply = (s: State, step: MazeStep) => {
  s.line = step.line;
  // Marking the dead ends is the wrap-up, not a decision.
  if (step.type !== "done") s.steps++;
  for (const cell of s.picked) s.states[cell] = CARVED;
  s.picked = [];
  switch (step.type) {
    case "start":
      if (step.frontier) {
        s.states[step.cell] = CARVED;
        for (const cell of step.frontier) s.states[cell] = FRONTIER;
      } else s.states[step.cell] = STACK;
      s.current = step.cell;
      break;
    case "pick":
      s.states[step.wall] = PICKED;
      s.states[step.cell] = PICKED;
      s.picked = [step.wall, step.cell];
      for (const cell of step.frontier) s.states[cell] = FRONTIER;
      s.current = step.cell;
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
  /** Where carving starts, picked by the seed. */
  readonly start: number;
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
    this.start = startOf(grid, random);
    const initial: State = {
      states: new Uint8Array(grid.rows * grid.cols),
      current: null,
      line: null,
      steps: 0,
      deadEnds: null,
      picked: [],
    };
    const working = clone(initial);
    this.checkpoints.push(clone(initial));
    for (const step of mazeGenerators[algorithm](grid, this.start, random)) {
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
