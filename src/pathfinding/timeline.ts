import { stepCost } from "./grid";
import { FRONTIER, ON_PATH, VISITED, type Grid, type PathFrame, type PathSearch, type PathStep } from "./types";

type State = {
  states: Uint8Array;
  current: number | null;
  line: number | null;
  found: boolean | null;
  visited: number;
  pathLength: number;
  pathCost: number;
};

/** How a step plays back: visits get a beat, frontier updates a shorter one, the path a quick trace. */
export type PathStepKind = PathStep["type"];

// Grids are small, so a full copy every few hundred steps keeps seeking instant.
const CHECKPOINT_EVERY = 256;

const clone = (s: State): State => ({ ...s, states: s.states.slice() });

const apply = (s: State, step: PathStep, grid: Grid) => {
  if (step.line !== undefined) s.line = step.line;
  switch (step.type) {
    case "visit":
      s.states[step.cell] = VISITED;
      s.current = step.cell;
      s.visited++;
      break;
    case "frontier":
      for (const cell of step.cells) if (s.states[cell] !== VISITED) s.states[cell] = FRONTIER;
      break;
    case "path":
      s.states[step.cell] = ON_PATH;
      s.current = null;
      // The start costs nothing to stand on; every later cell costs its step.
      if (step.cell !== grid.start) {
        s.pathLength++;
        s.pathCost += stepCost(grid, step.cell);
      }
      break;
    case "done":
      s.found = step.found;
      s.current = null;
      break;
  }
};

/** A whole search, recorded up front: frame i is the grid after i steps. */
export class PathTimeline {
  readonly length: number;
  /** Cells the search examines in all; races run on this clock. */
  readonly totalVisits: number;
  private readonly steps: PathStep[] = [];
  /** For each visit, in order, the frame just before it. */
  private readonly beforeVisit: number[] = [];
  private readonly checkpoints: State[] = [];
  private cursor: { index: number; state: State };
  private cache = new Map<number, PathFrame>();

  constructor(
    search: PathSearch,
    readonly grid: Grid
  ) {
    const initial: State = {
      states: new Uint8Array(grid.rows * grid.cols),
      current: null,
      line: null,
      found: null,
      visited: 0,
      pathLength: 0,
      pathCost: 0,
    };
    const working = clone(initial);
    this.checkpoints.push(clone(initial));
    for (const step of search(grid)) {
      if (step.type === "visit") this.beforeVisit.push(this.steps.length);
      this.steps.push(step);
      apply(working, step, grid);
      if (this.steps.length % CHECKPOINT_EVERY === 0) this.checkpoints.push(clone(working));
    }
    this.length = this.steps.length + 1;
    this.totalVisits = this.beforeVisit.length;
    this.cursor = { index: 0, state: clone(initial) };
  }

  frameAt(index: number): PathFrame {
    const i = Math.min(Math.max(index, 0), this.length - 1);
    const cached = this.cache.get(i);
    if (cached) return cached;
    const { cursor } = this;
    if (i < cursor.index || i - cursor.index > CHECKPOINT_EVERY) {
      const k = Math.floor(i / CHECKPOINT_EVERY);
      cursor.index = k * CHECKPOINT_EVERY;
      cursor.state = clone(this.checkpoints[k]);
    }
    while (cursor.index < i) apply(cursor.state, this.steps[cursor.index++], this.grid);
    const s = cursor.state;
    const frame: PathFrame = {
      states: s.states.slice(),
      current: s.current,
      line: s.line,
      found: s.found,
      stats: { visited: s.visited, pathLength: s.pathLength, pathCost: s.pathCost },
    };
    if (this.cache.size >= 8) this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(i, frame);
    return frame;
  }

  /**
   * The frame after `visits` cells have been examined (and the frontier updated
   * for the last one). Once every visit is done, the last frame: the path traced.
   */
  frameIndexAtVisits(visits: number): number {
    if (visits <= 0) return 0;
    if (visits >= this.totalVisits) return this.length - 1;
    return this.beforeVisit[visits];
  }

  /** The step that leads from frame `index - 1` to frame `index`. */
  stepAt(index: number): PathStep | null {
    return index > 0 && index < this.length ? this.steps[index - 1] : null;
  }
}
