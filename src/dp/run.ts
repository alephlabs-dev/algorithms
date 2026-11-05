import type { Cell, Direction, DpEvent, DpFrame, Option, TableRun, TraceStep, WordsAlgorithm } from "./types";

// Pseudocode lines (see pseudocode.ts).
export const DP_LINE = {
  base: 0,
  loop: 1,
  match: 2,
  other: 3,
  /** Edit distance's way back; LCS's starts a line earlier (keep, then skip). */
  trace: 5,
} as const;

const traceLine = (algorithm: WordsAlgorithm, kind: TraceStep["kind"]) =>
  algorithm === "edit" ? DP_LINE.trace : kind === "keep" ? 5 : 6;

const step = (move: Direction, { i, j }: Cell): Cell =>
  move === "diag" ? { i: i - 1, j: j - 1 } : move === "up" ? { i: i - 1, j } : { i, j: j - 1 };

/**
 * Fills the table for two words and walks back from the corner, recording a
 * frame per cell and per step back. Edit distance: D[i][j] is the fewest
 * inserts, deletes and replacements turning a's first i letters into b's
 * first j. LCS: L[i][j] is the length of the longest subsequence the two
 * prefixes share.
 */
export class DpRun implements TableRun {
  readonly table: number[][];
  readonly frames: DpFrame[] = [];
  readonly answer: number;
  readonly trace: TraceStep[] = [];

  constructor(
    readonly algorithm: WordsAlgorithm,
    readonly a: string,
    readonly b: string,
  ) {
    const m = a.length;
    const n = b.length;
    const edit = algorithm === "edit";
    this.table = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (edit ? (i === 0 ? j : j === 0 ? i : 0) : 0)),
    );
    const frame = (event: DpEvent, extra: Partial<DpFrame>, line: number | null) =>
      this.frames.push({ event, base: false, filled: 0, focus: null, deps: [], trace: [], line, ...extra });

    frame({ type: "start" }, {}, null);
    frame({ type: "base" }, { base: true }, DP_LINE.base);

    let filled = 0;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const T = this.table;
        const match = a[i - 1] === b[j - 1];
        const diag = { i: i - 1, j: j - 1 };
        const up = { i: i - 1, j };
        const left = { i, j: j - 1 };
        const options: Option[] = edit
          ? match
            ? [{ from: "diag", value: T[i - 1][j - 1], cell: diag }]
            : [
                { from: "diag", value: T[i - 1][j - 1] + 1, cell: diag },
                { from: "up", value: T[i - 1][j] + 1, cell: up },
                { from: "left", value: T[i][j - 1] + 1, cell: left },
              ]
          : match
            ? [{ from: "diag", value: T[i - 1][j - 1] + 1, cell: diag }]
            : [
                { from: "up", value: T[i - 1][j], cell: up },
                { from: "left", value: T[i][j - 1], cell: left },
              ];
        // Ties go to the first option: diagonal, then up, then left.
        const best = options.reduce((x, y) => ((edit ? y.value < x.value : y.value > x.value) ? y : x));
        T[i][j] = best.value;
        filled++;
        frame(
          { type: "cell", i, j, value: best.value, match, options, pick: best.from },
          {
            base: true,
            filled,
            focus: { i, j },
            deps: options.map((o) => o.cell),
          },
          match ? DP_LINE.match : DP_LINE.other,
        );
      }
    }
    this.answer = this.table[m][n];

    // Back from the corner, the way each value came.
    let at: Cell = { i: m, j: n };
    const done = (c: Cell) => (edit ? c.i === 0 && c.j === 0 : c.i === 0 || c.j === 0);
    while (!done(at)) {
      const { i, j } = at;
      const T = this.table;
      let move: Direction;
      let kind: TraceStep["kind"];
      if (edit) {
        if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && T[i][j] === T[i - 1][j - 1]) [move, kind] = ["diag", "match"];
        else if (i > 0 && j > 0 && T[i][j] === T[i - 1][j - 1] + 1) [move, kind] = ["diag", "replace"];
        else if (i > 0 && T[i][j] === T[i - 1][j] + 1) [move, kind] = ["up", "delete"];
        else [move, kind] = ["left", "insert"];
      } else if (a[i - 1] === b[j - 1]) [move, kind] = ["diag", "keep"];
      else [move, kind] = [T[i - 1][j] >= T[i][j - 1] ? "up" : "left", "skip"];
      const to = step(move, at);
      this.trace.push({ i, j, move, kind, to });
      frame(
        { type: "trace", step: { i, j, move, kind, to } },
        { base: true, filled, focus: { i, j }, deps: [to], trace: this.trace.slice() },
        traceLine(algorithm, kind),
      );
      at = to;
    }
    frame({ type: "done", answer: this.answer }, { base: true, filled, trace: this.trace.slice() }, null);
  }

  get length() {
    return this.frames.length;
  }

  get rowLabels() {
    return ["ε", ...this.a];
  }

  get colLabels() {
    return ["ε", ...this.b];
  }

  // Row and column 0 come first, all at once; then the rest, row by row.
  fillIndex = (i: number, j: number) => (i === 0 || j === 0 ? -1 : (i - 1) * this.b.length + (j - 1));
}

/** The alignment the way back spells out, in reading order: one column per letter kept, changed, deleted or inserted. */
export const alignment = (a: string, b: string, trace: TraceStep[]) =>
  trace
    .slice()
    .reverse()
    .map((s) => ({
      kind: s.kind,
      top: s.kind === "insert" ? null : a[s.i - 1],
      bottom: s.kind === "delete" ? null : b[s.j - 1],
    }));

/** LCS: the shared letters the way back has kept, in reading order. */
export const keptLetters = (a: string, trace: TraceStep[]) =>
  trace
    .filter((s) => s.kind === "keep")
    .reverse()
    .map((s) => a[s.i - 1])
    .join("");
