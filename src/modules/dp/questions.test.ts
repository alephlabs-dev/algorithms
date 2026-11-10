import { describe, expect, it } from "vitest";
import { DpRun } from "./run";
import { KnapsackRun } from "./knapsack";
import { EXAMPLE_CAPACITY, EXAMPLE_ITEMS } from "./presets";
import { dpQuestions } from "./questions";

describe("guess mode questions", () => {
  it("asks about every third DP cell and the corner, with the answer among the options", () => {
    for (const run of [new DpRun("edit", "KITTEN", "SITTING"), new KnapsackRun(EXAMPLE_ITEMS, EXAMPLE_CAPACITY)]) {
      const questions = dpQuestions(run);
      const cells = run.frames.filter((f) => f.event.type === "cell").length;
      expect(questions.length).toBeGreaterThanOrEqual(Math.floor(cells / 3));
      for (const q of questions) {
        expect(run.frames[q.at].event.type).toBe("cell");
        if (q.kind === "choice") {
          expect(q.options).toContain(q.answer);
          expect(new Set(q.options).size).toBe(q.options.length);
        }
      }
      // The corner holds the answer.
      const last = questions[questions.length - 1];
      expect(last.kind === "choice" && last.answer).toBe(run.answer);
    }
  });
});
