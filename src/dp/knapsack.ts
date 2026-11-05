import type { DpEvent, DpFrame, Item, Option, TableRun, TraceStep } from "./types";

// Pseudocode lines (see pseudocode.ts).
export const KNAPSACK_LINE = {
  base: 0,
  leaveOnly: 2,
  better: 4,
  leave: 5,
  take: 6,
} as const;

/** Items are named A, B, C… in order. */
export const itemName = (k: number) => String.fromCharCode(65 + k);

/**
 * 0/1 knapsack: the most value that fits in a bag of `capacity`, taking each
 * item at most once. K[i][w] is the best using the first i items with room w.
 * Each cell either leaves item i (the cell above) or, if it fits, takes it
 * (the cell above, w − weight to the left, plus its value). Records a frame
 * per cell, then per step of the way back.
 */
export class KnapsackRun implements TableRun {
  readonly algorithm = "knapsack" as const;
  readonly table: number[][];
  readonly frames: DpFrame[] = [];
  readonly answer: number;
  readonly trace: TraceStep[] = [];

  constructor(
    readonly items: Item[],
    readonly capacity: number,
  ) {
    const n = items.length;
    const W = capacity;
    this.table = Array.from({ length: n + 1 }, () => Array.from({ length: W + 1 }, () => 0));
    const frame = (event: DpEvent, extra: Partial<DpFrame>, line: number | null) =>
      this.frames.push({ event, base: false, filled: 0, focus: null, deps: [], trace: [], line, ...extra });

    frame({ type: "start" }, {}, null);
    frame({ type: "base" }, { base: true }, KNAPSACK_LINE.base);

    let filled = 0;
    const T = this.table;
    for (let i = 1; i <= n; i++) {
      const { weight, value } = items[i - 1];
      for (let w = 0; w <= W; w++) {
        const options: Option[] = [{ from: "leave", value: T[i - 1][w], cell: { i: i - 1, j: w } }];
        if (weight <= w)
          options.push({ from: "take", value: T[i - 1][w - weight] + value, cell: { i: i - 1, j: w - weight } });
        // A tie leaves the item: the same value, more room to spare.
        const best = options.reduce((x, y) => (y.value > x.value ? y : x));
        T[i][w] = best.value;
        filled++;
        frame(
          { type: "cell", i, j: w, value: best.value, match: false, options, pick: best.from },
          { base: true, filled, focus: { i, j: w }, deps: options.map((o) => o.cell) },
          options.length > 1 ? KNAPSACK_LINE.better : KNAPSACK_LINE.leaveOnly,
        );
      }
    }
    this.answer = T[n][W];

    let i = n;
    let w = W;
    while (i > 0) {
      const take = T[i][w] !== T[i - 1][w];
      const to = { i: i - 1, j: take ? w - items[i - 1].weight : w };
      const step: TraceStep = { i, j: w, move: take ? "take" : "leave", kind: take ? "take" : "leave", to };
      this.trace.push(step);
      frame(
        { type: "trace", step },
        { base: true, filled, focus: { i, j: w }, deps: [to], trace: this.trace.slice() },
        take ? KNAPSACK_LINE.take : KNAPSACK_LINE.leave,
      );
      i = to.i;
      w = to.j;
    }
    frame({ type: "done", answer: this.answer }, { base: true, filled, trace: this.trace.slice() }, null);
  }

  get length() {
    return this.frames.length;
  }

  get rowLabels() {
    return ["–", ...this.items.map((_, k) => itemName(k))];
  }

  get colLabels() {
    return Array.from({ length: this.capacity + 1 }, (_, w) => String(w));
  }

  // Row 0 first, all at once; then every row in full, column 0 included.
  fillIndex = (i: number, j: number) => (i === 0 ? -1 : (i - 1) * (this.capacity + 1) + j);

  /** The items the way back took, in order. */
  get chosen() {
    return this.trace
      .filter((s) => s.kind === "take")
      .map((s) => s.i - 1)
      .reverse();
  }
}

/** Items the way back has taken so far, in order. */
export const takenItems = (trace: TraceStep[]) =>
  trace
    .filter((s) => s.kind === "take")
    .map((s) => s.i - 1)
    .reverse();
