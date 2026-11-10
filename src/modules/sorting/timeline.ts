import type { Frame, SortAlgorithm, Stats, Step } from "./types";

/** Everything the timeline tracks while replaying steps. Highlights hold item ids. */
type State = {
  values: number[]; // value at each position
  ids: number[]; // item id at each position
  active: number[];
  temp: number[];
  focus: number[];
  pivot: number | null;
  hop: number | null;
  line: number | null;
  done: Set<number>;
  stats: Stats;
};

/** Marks the end of a run: clears highlights and marks every item done. */
export type FinishStep = { type: "finish" };

/**
 * What a step does, for pacing playback. "line" is a highlight step that only
 * moves the pseudocode line, so nothing changes in the bars.
 */
export type StepKind = Step["type"] | "finish" | "line";

// A full copy of the state is kept every CHECKPOINT_EVERY steps, so any frame can
// be rebuilt by replaying at most that many steps. Playing forward costs one step.
const CHECKPOINT_EVERY = 512;

const cloneState = (s: State): State => ({
  ...s,
  values: [...s.values],
  ids: [...s.ids],
  done: new Set(s.done),
  stats: { ...s.stats },
});

const applyStep = (s: State, step: Step | FinishStep) => {
  s.hop = null;
  const idsAt = (positions: number[]) => positions.map((p) => s.ids[p]);

  switch (step.type) {
    case "compare":
      s.stats.comparisons++;
      s.active = idsAt([step.i, step.j]);
      break;
    case "swap": {
      s.stats.swaps++;
      const { i, j } = step;
      [s.values[i], s.values[j]] = [s.values[j], s.values[i]];
      [s.ids[i], s.ids[j]] = [s.ids[j], s.ids[i]];
      // The item that moved right hops over the other one.
      if (i !== j) s.hop = s.ids[Math.max(i, j)];
      break;
    }
    case "move": {
      s.stats.writes++;
      const { from, to } = step;
      if (from !== to) {
        const [value] = s.values.splice(from, 1);
        const [id] = s.ids.splice(from, 1);
        s.values.splice(to, 0, value);
        s.ids.splice(to, 0, id);
        s.hop = id;
      }
      break;
    }
    case "done":
      idsAt(step.indices).forEach((id) => s.done.add(id));
      break;
    case "highlight":
      break;
    case "finish":
      s.active = [];
      s.temp = [];
      s.focus = [];
      s.pivot = null;
      s.line = null;
      s.ids.forEach((id) => s.done.add(id));
      return;
  }

  if (step.active) s.active = idsAt(step.active);
  if (step.temp) s.temp = idsAt(step.temp);
  if (step.focus) s.focus = idsAt(step.focus);
  if (step.pivot !== undefined) s.pivot = step.pivot === null ? null : s.ids[step.pivot];
  if (step.line !== undefined) s.line = step.line;
};

const toFrame = (s: State): Frame => ({
  order: [...s.ids],
  // An item that just reached its final place stops being "compared".
  active: s.active.filter((id) => !s.done.has(id)),
  temp: s.temp,
  done: [...s.done],
  focus: s.focus,
  pivot: s.pivot,
  hop: s.hop,
  line: s.line,
  stats: { ...s.stats },
});

/**
 * A recorded run. Frame 0 is the input; frame `length - 1` is the sorted result.
 * Frames are rebuilt on demand, and the last few are cached so repeated reads
 * return the same object (store selectors rely on that).
 */
export class Timeline {
  /** Value of each item, by id. */
  readonly values: readonly number[];
  readonly length: number;
  /** Comparisons + swaps + writes over the whole run. */
  readonly totalOps: number;

  private readonly steps: (Step | FinishStep)[];
  /** Operations done by frame k (cumulative), for races that run on an operation clock. */
  private readonly opsAt: Uint32Array;
  private readonly checkpoints: State[];
  private cursor: { index: number; state: State };
  private cache = new Map<number, Frame>();

  constructor(algorithm: SortAlgorithm, input: readonly number[]) {
    const initial: State = {
      values: [...input],
      ids: input.map((_, id) => id),
      active: [],
      temp: [],
      focus: [],
      pivot: null,
      hop: null,
      line: null,
      done: new Set(),
      stats: { comparisons: 0, swaps: 0, writes: 0 },
    };
    this.values = [...input];
    this.steps = [];
    this.checkpoints = [cloneState(initial)];

    // The generator reads `working.values`, which each applied step updates.
    const working = cloneState(initial);
    const ops: number[] = [0];
    const record = (step: Step | FinishStep) => {
      applyStep(working, step);
      this.steps.push(step);
      const { comparisons, swaps, writes } = working.stats;
      ops.push(comparisons + swaps + writes);
      if (this.steps.length % CHECKPOINT_EVERY === 0) {
        this.checkpoints.push(cloneState(working));
      }
    };
    for (const step of algorithm(working.values)) record(step);
    record({ type: "finish" });

    this.length = this.steps.length + 1;
    this.opsAt = Uint32Array.from(ops);
    this.totalOps = ops[ops.length - 1];
    this.cursor = { index: 0, state: cloneState(initial) };
  }

  frameAt(index: number): Frame {
    const i = Math.min(Math.max(index, 0), this.length - 1);
    const cached = this.cache.get(i);
    if (cached) return cached;

    // Replay from the cursor when moving forward a little (normal playback),
    // otherwise from the nearest checkpoint at or before `i`.
    const { cursor } = this;
    if (i < cursor.index || i - cursor.index > CHECKPOINT_EVERY) {
      const k = Math.floor(i / CHECKPOINT_EVERY);
      cursor.index = k * CHECKPOINT_EVERY;
      cursor.state = cloneState(this.checkpoints[k]);
    }
    while (cursor.index < i) {
      applyStep(cursor.state, this.steps[cursor.index]);
      cursor.index++;
    }

    const frame = toFrame(cursor.state);
    if (this.cache.size >= 8) this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(i, frame);
    return frame;
  }

  /**
   * The frame showing the run after `ops` operations: the last frame with at
   * most that many, so frames that only move highlights pass instantly.
   */
  frameIndexAtOps(ops: number): number {
    if (ops >= this.totalOps) return this.length - 1;
    let lo = 0;
    let hi = this.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.opsAt[mid] <= ops) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  /** The step that leads from frame `index - 1` to frame `index`. */
  stepAt(index: number): Step | FinishStep | null {
    if (index <= 0 || index >= this.length) return null;
    return this.steps[index - 1];
  }

  /** The kind of step that leads from frame `index - 1` to frame `index`. */
  kindAt(index: number): StepKind | null {
    if (index <= 0 || index >= this.length) return null;
    const step = this.steps[index - 1];
    if (step.type !== "highlight") return step.type;
    const visible =
      step.active !== undefined ||
      step.temp !== undefined ||
      step.focus !== undefined ||
      step.pivot !== undefined;
    return visible ? "highlight" : "line";
  }

  /** Values in array order for a frame. */
  valuesAt(index: number): number[] {
    return this.frameAt(index).order.map((id) => this.values[id]);
  }
}

export const range = (start: number, end: number) =>
  Array.from({ length: Math.max(0, end - start) }, (_, k) => start + k);
