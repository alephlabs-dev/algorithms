import { describe, expect, it } from "vitest";
import { sortAlgorithms } from "@/algorithms";
import { Timeline } from "@/algorithms/timeline";
import type { InputOrder } from "@/types";
import { generateItems } from "@/utils/generateItems";
import { seededRandom } from "@/utils/random";
import { sortQuestions, type Question } from ".";

const input = [7, 3, 9, 1, 5, 8, 2, 10, 4, 6];
const orders: InputOrder[] = ["random", "sorted", "reversed", "fewUnique"];
const sorted = (values: readonly number[]) => [...values].sort((a, b) => a - b);

const choices = (questions: Question[]) =>
  questions.map((q) => {
    if (q.kind !== "choice") throw new Error(`expected a choice question, got ${q.kind}`);
    return q;
  });

const expectFairOptions = (questions: Question[]) => {
  let last = 0;
  choices(questions).forEach((q) => {
    expect(q.at).toBeGreaterThan(last);
    last = q.at;
    expect(q.options).toContain(q.answer);
    expect(q.options.length).toBeLessThanOrEqual(4);
    expect(q.options.length).toBeGreaterThan(1);
    expect(new Set(q.options).size).toBe(q.options.length);
  });
};

/** Insertion asks 9 questions at 10 items and 19 at 20; a run should feel about as long. */
const expectInsertionLikeCounts = (algorithm: "merge" | "heap") => {
  const count = (size: number, order: InputOrder) =>
    sortQuestions(new Timeline(sortAlgorithms[algorithm], generateItems(size, order, seededRandom(7))), algorithm).length;
  for (const order of orders) {
    expect(count(10, order)).toBeGreaterThanOrEqual(4);
    expect(count(10, order)).toBeLessThanOrEqual(12);
    expect(count(20, order)).toBeGreaterThanOrEqual(10);
    expect(count(20, order)).toBeLessThanOrEqual(24);
  }
};

/** Where the answer sits among the buttons, over a few runs: it mustn't always be the same spot. */
const expectVariedSpots = (algorithm: "merge" | "heap") => {
  const spots = (["random", "reversed", "fewUnique"] as InputOrder[]).flatMap((order) => {
    const items = generateItems(10, order, seededRandom(3));
    const questions = choices(sortQuestions(new Timeline(sortAlgorithms[algorithm], items), algorithm));
    // The same run always shows the same order, so replays and tests are stable.
    const again = choices(sortQuestions(new Timeline(sortAlgorithms[algorithm], items), algorithm));
    expect(again.map((q) => q.options)).toEqual(questions.map((q) => q.options));
    return questions.map((q) => {
      const spot = q.options.indexOf(q.answer);
      return spot === 0 ? "first" : spot === q.options.length - 1 ? "last" : "middle";
    });
  });
  expect(spots).toContain("first");
  expect(spots).toContain("last");
  expect(spots).toContain("middle");
};

describe("guess mode questions for merge sort", () => {
  const run = (items: number[]) => new Timeline(sortAlgorithms.merge, items);

  it("asks which value is placed next, on every third placement where both runs still have values", () => {
    // Worked by hand, the placements that compare two fronts, in order:
    // [7]+[3]: 3. [1]+[5]: 1. [9]+[1 5]: 1, 5. [3 7]+[1 5 9]: 1, 3, 5, 7. [8]+[2]: 2. [4]+[6]: 4.
    // [10]+[4 6]: 4, 6. [2 8]+[4 6 10]: 2, 4, 6, 8. [1 3 5 7 9]+[2 4 6 8 10]: 1, 2, 3, 4, 5, 6, 7, 8, 9.
    // The 2nd, 5th, 8th… of those 25: 1, 1, 7, 4, 4, 1, 4, 7.
    const timeline = run(input);
    const questions = choices(sortQuestions(timeline, "merge"));
    expect(questions.map((q) => q.answer)).toEqual([1, 1, 7, 4, 4, 1, 4, 7]);
    // [1] and [5] merge: just the two fronts, and both bars are labelled (ids are input positions).
    expect(sorted(questions[0].options)).toEqual([1, 5]);
    expect(sorted(questions[0].labels ?? [])).toEqual([3, 4]);
    // [3 7] and [1 5 9]: the fronts 3 and 1, then the smallest of the rest, 5 and 7.
    expect(sorted(questions[1].options)).toEqual([1, 3, 5, 7]);
    expect(sorted(questions[1].labels ?? [])).toEqual([0, 1, 3, 4]);
    // The last merge opens (the 6th question): fronts 1 and 2, then 3 and 4.
    expect(sorted(questions[5].options)).toEqual([1, 2, 3, 4]);
  });

  it.each(orders)("on %s input: the chosen value is the one placed next, asked before the fronts are compared", (order) => {
    const timeline = run(generateItems(10, order, seededRandom(7)));
    const value = (id: number) => timeline.values[id];
    const questions = choices(sortQuestions(timeline, "merge"));
    expectFairOptions(questions);

    // The placements that compare two fronts, read from the steps; every third one is asked about,
    // unless every value left in the two runs is the same (nothing to tell apart).
    const compares: number[] = [];
    for (let f = 1; f < timeline.length; f++) if (timeline.stepAt(f)?.type === "compare") compares.push(f);
    const expected = compares.filter((f, k) => {
      if (k % 3 !== 1) return false;
      const step = timeline.stepAt(f) as { i: number };
      const shown = timeline.frameAt(f - 1);
      const end = Math.max(...shown.focus.map((id) => shown.order.indexOf(id))) + 1;
      return new Set(shown.order.slice(step.i, end).map(value)).size > 1;
    });
    expect(questions.map((q) => q.at)).toEqual(expected);
    expect(questions.length).toBeGreaterThan(0);

    questions.forEach((q) => {
      const step = timeline.stepAt(q.at);
      if (step?.type !== "compare") throw new Error("expected the fronts' comparison next");
      const shown = timeline.frameAt(q.at - 1);
      // On screen: the merge in focus, what's merged so far lit, the two runs after it.
      const positions = shown.focus.map((id) => shown.order.indexOf(id));
      const end = Math.max(...positions) + 1;
      expect(Math.min(...positions)).toBeLessThanOrEqual(step.i);
      for (let p = Math.min(...positions); p < step.i; p++) expect(shown.temp).toContain(shown.order[p]);
      const runs = shown.order.slice(step.i, end);
      // The fronts are offered, and every option is a value still in the runs.
      expect(q.options).toContain(value(shown.order[step.i]));
      expect(q.options).toContain(value(shown.order[step.j]));
      for (const option of q.options) expect(runs.map(value)).toContain(option);
      // Every bar in the runs holding an offered value is labelled, and only those.
      expect(sorted(q.labels ?? [])).toEqual(sorted(runs.filter((id) => q.options.includes(value(id)))));
      // What the run really does: two frames on, the next place holds the chosen value.
      const placed = timeline.frameAt(q.at + 1);
      expect(value(placed.order[step.i])).toBe(q.answer);
      expect(placed.temp).toContain(placed.order[step.i]);
      expect(q.explain(true)).toMatch(/^Right/);
      expect(q.explain(false)).toContain(String(q.answer));
    });
  });

  it("asks about as many questions as insertion (9 at 10 items, 19 at 20), give or take", () =>
    expectInsertionLikeCounts("merge"));

  it("shuffles its options, since the answer is always the smallest", () => expectVariedSpots("merge"));
});

describe("guess mode questions for heap sort", () => {
  const run = (items: number[]) => new Timeline(sortAlgorithms.heap, items);

  it("asks which child the node swaps with, or whether it stays, on every third step with two children", () => {
    // Worked by hand, each sift-down step where the node has two children (node: children → answer):
    // building: 1: 10 4 → 10; 9: 8 2 → stays; 3: 10 6 → 10; 3: 1 4 → 4; 7: 10 9 → 10; 7: 4 6 → stays.
    // Sorting: 5: 7 9 → 9; 5: 8 2 → 8; 3: 7 8 → 8; 3: 5 2 → 5; 1: 7 5 → 7; 1: 4 6 → 6; 2: 6 5 → 6;
    // 2: 4 1 → 4; 3: 4 5 → 5; 1: 4 3 → 4; 2: 1 3 → 3. It asks about the 2nd, 5th, 8th…
    const questions = choices(sortQuestions(run(input), "heap"));
    expect(questions.map((q) => q.answer)).toEqual([9, 10, 8, 7, 4, 3]);
    // 9 with children 8 and 2: the children in array order, then 9 itself, labelled as staying.
    expect(questions[0].options).toEqual([8, 2, 9]);
    expect(questions[0].optionLabels).toEqual(["8", "2", "9 stays"]);
    expect(questions[0].prompt).toContain("9");
    // The node and its two children are labelled (ids are input positions: 9, 8 and 2).
    expect(sorted(questions[0].labels ?? [])).toEqual([2, 5, 6]);
    expect(questions[0].explain(false)).toContain("stays");
  });

  it.each(orders)("on %s input: the answer is the swap that follows, or stays when there's none", (order) => {
    const timeline = run(generateItems(10, order, seededRandom(7)));
    const value = (id: number) => timeline.values[id];
    const questions = choices(sortQuestions(timeline, "heap"));
    expectFairOptions(questions);

    // A node with two children compares them first, then the larger one with the node: two compares in a row.
    const twoChild: number[] = [];
    for (let f = 1; f + 1 < timeline.length; f++)
      if (timeline.stepAt(f)?.type === "compare" && timeline.stepAt(f + 1)?.type === "compare") twoChild.push(f);
    const asked = twoChild.filter((f, k) => {
      if (k % 3 !== 1) return false;
      const step = timeline.stepAt(f) as { i: number; j: number };
      const shown = timeline.frameAt(f - 1);
      const node = (step.i - 1) / 2;
      return new Set([node, step.i, step.j].map((p) => value(shown.order[p]))).size > 1;
    });
    expect(questions.map((q) => q.at)).toEqual(asked);
    expect(questions.length).toBeGreaterThan(0);

    questions.forEach((q) => {
      const step = timeline.stepAt(q.at);
      if (step?.type !== "compare") throw new Error("expected the children's comparison next");
      const shown = timeline.frameAt(q.at - 1);
      const node = (step.i - 1) / 2;
      expect(Number.isInteger(node)).toBe(true);
      expect(step.j).toBe(step.i + 1);
      const ids = [node, step.i, step.j].map((p) => shown.order[p]);
      expect(sorted(q.labels ?? [])).toEqual(sorted(ids));
      const own = value(ids[0]);
      expect(q.prompt).toContain(String(own));
      // Options: the children's values and the node's own, the last one labelled as staying.
      for (const option of q.options) expect(ids.map(value)).toContain(option);
      expect(q.options).toContain(own);
      expect(q.optionLabels).toHaveLength(q.options.length);
      q.options.forEach((option, k) => {
        if (option === own) expect(q.optionLabels?.[k]).toMatch(/stays/);
        else expect(q.optionLabels?.[k]).toBe(String(option));
      });
      // What the run really does: after the two comparisons, the node's spot either gets a child or keeps its value.
      const after = timeline.frameAt(q.at + 2);
      const moved = after.order[node] !== ids[0];
      expect(moved).toBe(timeline.stepAt(q.at + 2)?.type === "swap");
      expect(q.answer).toBe(moved ? value(after.order[node]) : own);
      if (moved) expect(q.answer).toBeGreaterThan(own);
      expect(q.explain(true)).toMatch(/^Right/);
    });
  });

  it("asks about as many questions as insertion (9 at 10 items, 19 at 20), give or take", () =>
    expectInsertionLikeCounts("heap"));

  it("over a few runs, the answer is sometimes the left child, sometimes the right, sometimes staying", () =>
    expectVariedSpots("heap"));
});

it.each(["merge", "heap"] as const)("%s asks nothing when every value is the same: there's nothing to tell apart", (algorithm) => {
  const same = new Timeline(sortAlgorithms[algorithm], Array(10).fill(5));
  expect(sortQuestions(same, algorithm)).toEqual([]);
});
