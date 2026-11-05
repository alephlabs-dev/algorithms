import { describe, expect, it } from "vitest";
import { sortAlgorithms } from "@/algorithms";
import { Timeline } from "@/algorithms/timeline";
import { DpRun, KnapsackRun, EXAMPLE_CAPACITY, EXAMPLE_ITEMS } from "@/dp";
import { presetOperations, recordStructure, type StructureAlgorithm } from "@/structures";
import type { InputOrder } from "@/types";
import { generateItems } from "@/utils/generateItems";
import { seededRandom } from "@/utils/random";
import { dpQuestions, sortQuestions, structureQuestions } from ".";

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

  it("other algorithms ask nothing yet", () => {
    expect(sortQuestions(new Timeline(sortAlgorithms.merge, input), "merge")).toEqual([]);
  });
});

describe("guess mode questions", () => {
  const ops = presetOperations("example", "large", seededRandom(1));

  it.each(["bst", "avl", "heap", "chaining", "probing"] as StructureAlgorithm[])(
    "%s: each question's answer is one of its choices, asked before it shows",
    (algorithm) => {
      const run = recordStructure(algorithm, ops);
      const questions = structureQuestions(run);
      expect(questions.length).toBeGreaterThan(0);
      let last = 0;
      for (const q of questions) {
        expect(q.at).toBeGreaterThan(last - 1);
        expect(q.at).toBeGreaterThan(0);
        expect(q.at).toBeLessThan(run.frames.length);
        last = q.at;
        if (q.kind === "slot") expect(q.slots.map((s) => s.key)).toContain(q.answer);
        if (q.kind === "choice") expect(q.options).toContain(q.answer);
        expect(q.explain(true).length).toBeGreaterThan(0);
        expect(q.explain(false).length).toBeGreaterThan(0);
      }
    },
  );

  it("asks where every insert lands but the first (an empty tree has one spot)", () => {
    const run = recordStructure("bst", ops);
    expect(structureQuestions(run).filter((q) => q.kind === "slot")).toHaveLength(ops.length - 1);
  });

  it("asks AVL whether it'll rotate, and the example does rotate sometimes", () => {
    const run = recordStructure("avl", ops);
    const rotate = structureQuestions(run).filter((q) => q.kind === "yesno");
    expect(rotate.some((q) => q.kind === "yesno" && q.answer)).toBe(true);
    expect(rotate.some((q) => q.kind === "yesno" && !q.answer)).toBe(true);
  });

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
