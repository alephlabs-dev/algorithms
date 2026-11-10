import { describe, expect, it } from "vitest";
import { sortAlgorithms } from "./sorts";
import { Timeline } from "./timeline";
import type { Algorithm, InputOrder } from "./types";
import { generateItems } from "./generateItems";
import { seededRandom } from "@/utils/random";
import { sortQuestions } from "./questions";

describe("guess mode questions for sorting", () => {
  const input = [7, 3, 9, 1, 5, 8, 2, 10, 4, 6];
  const run = (items: number[]) => new Timeline(sortAlgorithms.insertion, items);

  it("insertion asks how far each picked-up value moves left", () => {
    // Worked by hand: 3 passes 7; 9 stays; 1 passes 3, 7, 9; 5 passes 7, 9; and so on.
    const questions = sortQuestions(run(input), "insertion");
    expect(questions.map((q) => q.kind === "choice" && q.answer)).toEqual([1, 0, 3, 2, 1, 5, 0, 5, 4]);
  });

  it.each(["random", "sorted", "reversed", "fewUnique"] as InputOrder[])(
    "insertion on %s input: each answer is where the value really ends up, asked before it moves",
    (order) => {
      const timeline = run(generateItems(10, order, seededRandom(7)));
      const questions = sortQuestions(timeline, "insertion");
      expect(questions).toHaveLength(9);
      questions.forEach((q, k) => {
        expect(q.kind).toBe("choice");
        if (q.kind !== "choice") return;
        expect(q.at).toBeGreaterThan(0);
        expect(q.options).toContain(q.answer);
        expect(q.options.length).toBeLessThanOrEqual(4);
        expect(new Set(q.options).size).toBe(q.options.length);
        // The value picked up on pass k sits at position k + 1 until it moves.
        const shown = timeline.frameAt(q.at - 1);
        const id = shown.order[k + 1];
        // Asked with the pass on screen: the sorted part and the picked value lit, and the value labelled.
        expect(shown.temp).toContain(id);
        expect(q.labels).toEqual([id]);
        const passEnd = k + 1 < questions.length ? questions[k + 1].at - 1 : timeline.length - 1;
        const landed = timeline.frameAt(passEnd).order.indexOf(id);
        expect(q.answer).toBe(k + 1 - landed);
      });
    },
  );

  it.each(Object.keys(sortAlgorithms) as Algorithm[])("%s has its questions registered: it asks something", (algorithm) => {
    // Every sorting algorithm now has a builder; one that lost its registration would silently ask nothing.
    const questions = sortQuestions(new Timeline(sortAlgorithms[algorithm], input), algorithm);
    expect(questions.length).toBeGreaterThan(0);
  });
});

