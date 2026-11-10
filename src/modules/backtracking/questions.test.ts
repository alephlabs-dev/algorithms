import { describe, expect, it } from "vitest";
import { MAX_QUEENS, MIN_QUEENS } from "./types";
import { QueensRun } from "./queens";
import { DEAD_END, queensQuestions } from "./questions";
import { MAX_QUESTIONS } from "@/game/spread";

const sizes = Array.from({ length: MAX_QUEENS - MIN_QUEENS + 1 }, (_, k) => MIN_QUEENS + k);

/** What the run really does next in `row` after frame `after`: the column it lands in (from 1), or a dead end. */
const outcome = (run: QueensRun, row: number, after: number) => {
  for (let i = after + 1; i < run.length; i++) {
    const { event } = run.frames[i];
    if (event.type === "choice" && event.row === row) return event.col + 1;
    if (event.type === "deadEnd" && event.row === row) return DEAD_END;
  }
  throw new Error("the row never ends");
};

/** Which row each question is about, counted among every row tried (the run's own order). */
const attemptIndex = (run: QueensRun, at: number) =>
  run.frames.slice(0, at).filter((f) => f.event.type === "choice" || f.event.type === "backtrack").length;

describe("N-Queens guess mode questions", () => {
  it.each(sizes)("%d queens: each answer is where the queen really lands, asked before it's tried", (n) => {
    const run = new QueensRun(n);
    const questions = queensQuestions(run);
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) {
      if (q.kind !== "choice" || !q.queenRow) throw new Error("a column question");
      const { row, from } = q.queenRow;
      // Asked right after a queen lands in the row above, or after this row's queen is taken back.
      const shown = run.frames[q.at - 1].event;
      if (shown.type === "choice") expect([shown.row + 1, 0]).toEqual([row, from]);
      else if (shown.type === "backtrack") expect([shown.row, shown.col + 1]).toEqual([row, from]);
      else throw new Error(`asked after a ${shown.type}`);
      expect(q.answer).toBe(outcome(run, row, q.at - 1));
    }
  });

  it.each(sizes)("%d queens: columns from where it starts trying, at most four, then dead end", (n) => {
    for (const q of queensQuestions(new QueensRun(n))) {
      if (q.kind !== "choice" || !q.queenRow) throw new Error("a column question");
      const columns = q.options.slice(0, -1);
      expect(q.options[q.options.length - 1]).toBe(DEAD_END);
      expect(q.optionLabels?.[q.options.length - 1]).toBe("Dead end");
      expect(columns.length).toBeGreaterThan(0);
      expect(columns.length).toBeLessThanOrEqual(4);
      expect(columns).toEqual([...columns].sort((a, b) => a - b));
      for (const col of columns) {
        expect(col).toBeGreaterThan(q.queenRow.from);
        expect(col).toBeLessThanOrEqual(n);
      }
      expect(q.options).toContain(q.answer);
    }
  });

  it.each(sizes)("%d queens: at most ten, at least three rows tried apart", (n) => {
    const run = new QueensRun(n);
    const asked = queensQuestions(run).map((q) => attemptIndex(run, q.at));
    expect(asked.length).toBeLessThanOrEqual(MAX_QUESTIONS);
    for (let k = 1; k < asked.length; k++) expect(asked[k] - asked[k - 1]).toBeGreaterThanOrEqual(3);
  });

  it("8 queens: spread over the whole run, not bunched at the start", () => {
    const run = new QueensRun(8);
    const questions = queensQuestions(run);
    expect(questions).toHaveLength(MAX_QUESTIONS);
    // One in each tenth of the run.
    questions.forEach((q, w) => expect(Math.floor((q.at * 10) / run.length)).toBe(w));
  });

  it("8 queens: most questions come right after a backtrack, the moment that teaches it", () => {
    const run = new QueensRun(8);
    const afterBacktrack = queensQuestions(run).filter((q) => run.frames[q.at - 1].event.type === "backtrack");
    expect(afterBacktrack.length).toBeGreaterThanOrEqual(MAX_QUESTIONS / 2);
  });

  it.each(sizes)("%d queens: never two dead ends in a row, and at most a third of the answers (rounded up)", (n) => {
    // A run has no randomness (it always tries columns from the left), so each size has exactly one run to check.
    const answers = queensQuestions(new QueensRun(n)).map((q) => q.answer === DEAD_END);
    for (let k = 1; k < answers.length; k++) expect(answers[k] && answers[k - 1]).toBe(false);
    expect(answers.filter(Boolean).length).toBeLessThanOrEqual(Math.ceil(answers.length / 3));
  });

  it("never asks when only a dead end is left: the queen was taken back from the last column", () => {
    for (const n of sizes)
      for (const q of queensQuestions(new QueensRun(n)))
        if (q.kind === "choice" && q.queenRow) expect(q.queenRow.from).toBeLessThan(n);
  });

  it("never asks about row 1's first queen: it always lands in column 1", () => {
    for (const n of sizes) {
      for (const q of queensQuestions(new QueensRun(n))) expect(run0(q)).toBe(false);
    }
    function run0(q: ReturnType<typeof queensQuestions>[number]) {
      return q.kind === "choice" && q.queenRow?.row === 0 && q.queenRow.from === 0;
    }
  });

  it("explains a dead end with the columns attacked and the queen taken back", () => {
    const run = new QueensRun(6);
    const questions = queensQuestions(run);
    const deadEnd = questions.find((q) => q.answer === DEAD_END);
    expect(deadEnd).toBeDefined();
    expect(deadEnd!.explain(true)).toMatch(/^Right: columns? .* attacked .*, so row \d's queen is taken back\.$/);
    expect(deadEnd!.explain(false)).toMatch(/^It's a dead end: /);
  });

  it("names each attacking queen once, even when it rules out several columns", () => {
    // 4 queens, row 2: the queen in row 1, column 1, attacks columns 1 and 2.
    const q = queensQuestions(new QueensRun(4))[0];
    expect(q.explain(true)).toBe("Right: columns 1 and 2 are attacked (by the queen in row 1), so it lands in column 3.");
  });
});
