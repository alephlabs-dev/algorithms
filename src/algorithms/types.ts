/**
 * A sorting algorithm is a generator that *describes* what it does, one step at a time.
 *
 * It receives the working array read-only and never mutates it: it yields a `swap` or
 * `move` step and the timeline applies it before resuming the generator, so after
 * each `yield` the array already reflects that step.
 *
 * Indices in a step refer to positions in the array at the moment the step is yielded.
 */
export type SortAlgorithm = (arr: readonly number[]) => Generator<Step, void>;

/** Optional extras any step can carry. Positions are converted to items when applied. */
type Annotations = {
  /** Replace the "active" highlight (purple) with these positions. */
  active?: number[];
  /** Replace the "temp" highlight (yellow) with these positions. */
  temp?: number[];
  /** Positions currently being worked on; everything else is dimmed. Empty clears it. */
  focus?: number[];
  /** Position of the pivot (quick sort), or null to clear it. */
  pivot?: number | null;
  /** Pseudocode line (0-based) this step belongs to; it stays until another step changes it. */
  line?: number;
};

export type Step = Annotations &
  (
    | { type: "compare"; i: number; j: number }
    | { type: "swap"; i: number; j: number }
    /**
     * Take the value at `from` and insert it at `to`, shifting the ones in between.
     * Counts as one write even when `from === to` (the value is written in place).
     */
    | { type: "move"; from: number; to: number }
    /** Only change annotations. */
    | { type: "highlight" }
    /** These positions hold their final value. */
    | { type: "done"; indices: number[] }
  );

export type Stats = {
  comparisons: number;
  swaps: number;
  writes: number;
};

/**
 * Everything needed to draw one moment of the animation.
 * Items are ids (0..n-1, stable for the whole run); `values[id]` gives the value.
 */
export type Frame = {
  /** Item ids in array order. */
  order: number[];
  active: number[];
  temp: number[];
  done: number[];
  /** Items being worked on; empty means everything. */
  focus: number[];
  pivot: number | null;
  /** Item that moves over its neighbours in this frame (drawn as an arc). */
  hop: number | null;
  /** Current pseudocode line, if the algorithm annotates them. */
  line: number | null;
  stats: Stats;
};
