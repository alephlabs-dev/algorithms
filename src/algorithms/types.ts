/**
 * A sorting algorithm is a generator that *describes* what it does, one step at a time.
 *
 * It receives the working array read-only and never mutates it: it yields a `swap` or
 * `overwrite` step and the recorder applies it before resuming the generator, so after
 * each `yield` the array already reflects that step.
 *
 * Indices in a step refer to positions in the array at the moment the step is yielded.
 */
export type SortAlgorithm = (arr: readonly number[]) => Generator<Step, void>;

type HighlightOverrides = {
  /** Replace the "active" highlight (purple) with these positions. */
  active?: number[];
  /** Replace the "temp" highlight (yellow) with these positions. */
  temp?: number[];
  /** Positions currently being worked on; everything else is dimmed. Empty clears it. */
  focus?: number[];
  /** Position of the pivot (quick sort), or null to clear it. */
  pivot?: number | null;
};

export type Step = HighlightOverrides &
  (
    | { type: "compare"; i: number; j: number }
    | { type: "swap"; i: number; j: number }
    /** Write `values` into the array starting at `start` (used by merge sort). */
    | {
        type: "overwrite";
        start: number;
        values: number[];
        /** Position of a value that jumped left over others, so it can be drawn hopping. */
        hop?: number;
      }
    /** Only change highlights. */
    | { type: "highlight" }
    /** These positions hold their final value. */
    | { type: "done"; indices: number[] }
  );

export type Stats = {
  comparisons: number;
  swaps: number;
  writes: number;
};

/** Everything needed to draw one moment of the animation. Highlights hold values, not indices. */
export type Frame = {
  items: number[];
  active: number[];
  temp: number[];
  done: number[];
  /** Values being worked on; empty means everything. */
  focus: number[];
  pivot: number | null;
  /** Value that moves over its neighbours in this frame (drawn as an arc). */
  hop: number | null;
  stats: Stats;
};
