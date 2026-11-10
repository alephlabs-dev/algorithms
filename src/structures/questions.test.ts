import { describe, expect, it } from "vitest";
import { presetOperations, recordStructure, type StructureAlgorithm } from "@/structures";
import { seededRandom } from "@/utils/random";
import { structureQuestions } from "./questions";

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
});
