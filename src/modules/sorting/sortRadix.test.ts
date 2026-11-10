import { describe, expect, it } from "vitest";
import { sortAlgorithms } from "./sorts";
import { Timeline } from "./timeline";
import type { InputOrder } from "./types";
import { generateItems } from "./generateItems";
import { seededRandom } from "@/utils/random";
import { sortQuestions } from "./questions";

const run = (items: number[]) => new Timeline(sortAlgorithms.radix, items);

/** Frames where a digit pass starts, read from the pseudocode line (line 0: "for each digit"). */
const passStarts = (timeline: Timeline) => {
  const starts: number[] = [];
  for (let f = 1; f < timeline.length; f++)
    if (timeline.frameAt(f).line === 0 && timeline.frameAt(f - 1).line !== 0) starts.push(f);
  return starts;
};

describe("guess mode questions for radix sort", () => {
  it("asks which bucket every third value of each pass goes in", () => {
    // Worked by hand. Ones pass moves 50, 41, 12, 22, 32, 6, 37, 47, 8, 19: asks 41, 32, 47.
    // Tens pass then moves 6, 8, 12, 19, 22, 32, 37, 41, 47, 50: asks 8, 22, 41.
    const input = [37, 12, 47, 8, 22, 50, 19, 32, 6, 41];
    const timeline = run(input);
    const questions = sortQuestions(timeline, "radix");
    expect(questions.map((q) => q.kind === "choice" && q.answer)).toEqual([1, 2, 7, 0, 2, 4]);
    expect(questions.map((q) => timeline.values[q.labels![0]])).toEqual([41, 32, 47, 8, 22, 41]);
    expect(questions.map((q) => q.prompt.includes("ones digit"))).toEqual([true, true, true, false, false, false]);
    expect(questions.map((q) => q.prompt.includes("tens digit"))).toEqual([false, false, false, true, true, true]);
  });

  it.each(["random", "sorted", "reversed", "fewUnique"] as InputOrder[])(
    "on %s input: each answer is the labelled value's digit for the pass, asked before it moves",
    (order) => {
      const timeline = run(generateItems(10, order, seededRandom(7)));
      const questions = sortQuestions(timeline, "radix");
      const starts = passStarts(timeline);
      expect(starts.length).toBeGreaterThan(0);
      expect(questions.length).toBeGreaterThan(0);

      let last = 0;
      questions.forEach((q) => {
        expect(q.kind).toBe("choice");
        if (q.kind !== "choice") return;
        expect(q.at).toBeGreaterThan(last);
        last = q.at;
        expect(q.options).toContain(q.answer);
        expect(q.options.length).toBeLessThanOrEqual(4);
        expect(new Set(q.options).size).toBe(q.options.length);
        q.options.forEach((o) => {
          expect(Number.isInteger(o)).toBe(true);
          expect(o).toBeGreaterThanOrEqual(0);
          expect(o).toBeLessThanOrEqual(9);
        });
        expect(q.options).toEqual([...q.options].sort((a, b) => a - b));

        // Asked just before the frame that moves the labelled value.
        const step = timeline.stepAt(q.at);
        expect(step?.type).toBe("move");
        if (step?.type !== "move") return;
        const id = timeline.frameAt(q.at - 1).order[step.from];
        expect(q.labels).toEqual([id]);

        // The answer is that value's digit for this pass: ones on the first, tens on the second.
        const pass = starts.filter((s) => s < q.at).length - 1;
        const value = timeline.values[id];
        expect(q.answer).toBe(Math.floor(value / 10 ** pass) % 10);
        expect(q.prompt).toContain(String(value));
        expect(q.prompt).toContain(pass === 0 ? "ones digit" : "tens digit");
      });

      // Every third value each pass moves: the 2nd, 5th, 8th...
      starts.forEach((start, p) => {
        const end = p + 1 < starts.length ? starts[p + 1] : timeline.length;
        const moves: number[] = [];
        for (let f = start + 1; f < end; f++) if (timeline.stepAt(f)?.type === "move") moves.push(f);
        expect(moves).toHaveLength(10);
        const asked = questions.filter((q) => q.at > start && q.at < end).map((q) => q.at);
        expect(asked).toEqual(moves.filter((_, k) => k % 3 === 1));
      });
    },
  );
});
