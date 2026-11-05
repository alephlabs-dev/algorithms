import { describe, expect, it } from "vitest";
import { sortAlgorithms } from "@/algorithms";
import { Timeline } from "@/algorithms/timeline";
import type { InputOrder } from "@/types";
import { generateItems } from "@/utils/generateItems";
import { seededRandom } from "@/utils/random";
import { sortQuestions, type Question } from ".";

type PassAlgorithm = "selection" | "bubble" | "cocktail";

// Ties on purpose: two 2s and two 5s.
const input = [5, 2, 8, 2, 9, 1, 5, 7, 3, 6];
const run = (algorithm: PassAlgorithm, items: number[]) => new Timeline(sortAlgorithms[algorithm], items);
const sorted = (values: readonly number[]) => [...values].sort((a, b) => a - b);
const choices = (questions: Question[]) =>
  questions.map((q) => {
    if (q.kind !== "choice") throw new Error(`expected a choice question, got ${q.kind}`);
    return q;
  });

describe("guess mode questions for selection, bubble and cocktail", () => {
  it("selection asks which value goes into the next place, before each pass", () => {
    // Worked by hand: each pass takes the smallest value left, ties included.
    const questions = choices(sortQuestions(run("selection", input), "selection"));
    expect(questions.map((q) => q.answer)).toEqual([1, 2, 2, 3, 5, 5, 6, 7, 8]);
    // First pass: every value is in play, the four nearest the answer are offered, and their bars are labelled.
    expect(sorted(questions[0].options)).toEqual([1, 2, 3, 5]);
    expect(questions[0].labels).toEqual([0, 1, 3, 5, 6, 8]);
    expect(questions[0].at).toBe(1);
  });

  it("bubble asks which value reaches the end of each pass", () => {
    // Worked by hand: 9, 8, 7, 6 and 5 bubble up; the sixth pass swaps nothing (its largest, 5, is already last) and stops.
    const questions = choices(sortQuestions(run("bubble", input), "bubble"));
    expect(questions.map((q) => q.answer)).toEqual([9, 8, 7, 6, 5, 5]);
    expect(sorted(questions[0].options)).toEqual([6, 7, 8, 9]);
  });

  it("cocktail asks it both ways: the largest going right, the smallest going left", () => {
    // Worked by hand: right carries 9, left carries 1, right 8, left 2, then a pass with no swaps ends it.
    const questions = choices(sortQuestions(run("cocktail", input), "cocktail"));
    expect(questions.map((q) => q.answer)).toEqual([9, 1, 8, 2, 7]);
    expect(sorted(questions[1].options)).toEqual([1, 2, 3, 5]);
    expect(questions[0].prompt).not.toBe(questions[1].prompt);
  });

  const cases = (["selection", "bubble", "cocktail"] as PassAlgorithm[]).flatMap((algorithm) =>
    (["random", "sorted", "reversed", "fewUnique"] as InputOrder[]).map((order) => [algorithm, order] as const),
  );

  it.each(cases)("%s on %s input: one question per pass, asked before it, answered by what the pass does", (algorithm, order) => {
    const timeline = run(algorithm, generateItems(10, order, seededRandom(3)));
    const value = (id: number) => timeline.values[id];

    // Passes, read from the steps: each one ends by marking a place done (or, with no swaps, by stopping the run).
    const passStarts: number[] = [1];
    for (let f = 1; f < timeline.length - 1; f++)
      if (timeline.stepAt(f)?.type === "done" && timeline.stepAt(f + 1)?.type !== "finish") passStarts.push(f + 1);

    const questions = choices(sortQuestions(timeline, algorithm));
    let asked = 0;
    passStarts.forEach((start, k) => {
      const shown = timeline.frameAt(start - 1);
      const inPlay = shown.order.filter((id) => !shown.done.includes(id));
      // A pass among values that are all equal has nothing to ask.
      if (new Set(inPlay.map(value)).size < 2) return;
      const q = questions[asked++];
      expect(q, `pass ${k}`).toBeDefined();
      // Asked just before the pass's first frame, with nothing of the pass on screen yet.
      expect(q.at).toBe(start);
      expect(q.at).toBeGreaterThan(0);
      expect(q.options).toContain(q.answer);
      expect(q.options.length).toBeLessThanOrEqual(4);
      expect(q.options.length).toBeGreaterThan(1);
      expect(new Set(q.options).size).toBe(q.options.length);
      for (const option of q.options) expect(inPlay.map(value)).toContain(option);
      // Every bar holding an option's value is labelled, and only those.
      expect([...(q.labels ?? [])].sort()).toEqual(inPlay.filter((id) => q.options.includes(value(id))).sort());

      // Which end this pass fills: selection the front, bubble the back, cocktail the back then the front in turn.
      const toFront = algorithm === "selection" || (algorithm === "cocktail" && k % 2 === 1);
      const positions = inPlay.map((id) => shown.order.indexOf(id));
      const target = toFront ? Math.min(...positions) : Math.max(...positions);
      const end = k + 1 < passStarts.length ? passStarts[k + 1] - 1 : timeline.length - 1;
      const after = timeline.frameAt(end);
      // The run really put the answer there by the end of the pass, and it's the extreme of what was in play.
      expect(value(after.order[target])).toBe(q.answer);
      expect(after.done).toContain(after.order[target]);
      const extreme = toFront ? Math.min(...inPlay.map(value)) : Math.max(...inPlay.map(value));
      expect(q.answer).toBe(extreme);
    });
    expect(questions).toHaveLength(asked);
    expect(asked).toBeGreaterThan(0);
  });

  it("with ties, every bar holding the right value is labelled, so any of them is a right pick", () => {
    const timeline = run("selection", generateItems(10, "fewUnique", seededRandom(3)));
    const questions = choices(sortQuestions(timeline, "selection"));
    const tied = questions.filter((q) => (q.labels ?? []).filter((id) => timeline.values[id] === q.answer).length > 1);
    expect(tied.length).toBeGreaterThan(0);
  });

  it.each(["selection", "bubble", "cocktail"] as PassAlgorithm[])(
    "%s shuffles its options, so the answer isn't always the first or last button",
    (algorithm) => {
      const spots = (["random", "reversed", "fewUnique"] as InputOrder[]).flatMap((order) => {
        const items = generateItems(10, order, seededRandom(3));
        const questions = choices(sortQuestions(run(algorithm, items), algorithm));
        // The same run always shows the same order, so replays and tests are stable.
        const again = choices(sortQuestions(run(algorithm, items), algorithm));
        expect(again.map((q) => q.options)).toEqual(questions.map((q) => q.options));
        return questions.map((q) => {
          expect(q.options).toContain(q.answer);
          expect(q.options.length).toBeLessThanOrEqual(4);
          expect(new Set(q.options).size).toBe(q.options.length);
          const spot = q.options.indexOf(q.answer);
          return spot === 0 ? "first" : spot === q.options.length - 1 ? "last" : "middle";
        });
      });
      expect(spots.some((spot) => spot !== "first")).toBe(true);
      expect(spots.some((spot) => spot !== "last")).toBe(true);
      expect(spots).toContain("middle");
    },
  );
});
