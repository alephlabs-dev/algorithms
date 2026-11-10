import { describe, expect, it } from "vitest";
import { sortAlgorithms } from "./generators";
import { Timeline } from "./timeline";
import type { InputOrder } from "./types";
import { generateItems } from "./generateItems";
import { seededRandom } from "@/utils/random";
import type { Question } from "@/game";
import { sortQuestions } from "./questions";

const input = [7, 3, 9, 1, 5, 8, 2, 10, 4, 6];
const orders: InputOrder[] = ["random", "sorted", "reversed", "fewUnique"];

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
    expect(new Set(q.options).size).toBe(q.options.length);
    expect(q.options).toEqual([...q.options].sort((a, b) => a - b));
  });
};

describe("guess mode questions for quick sort", () => {
  const run = (items: number[]) => new Timeline(sortAlgorithms.quick, items);

  it("asks how many values in each partition are smaller than its pivot", () => {
    // Worked by hand: pivot 6 has 3, 1, 5, 2, 4 below it; then [3 1 5 2 4] around 4 (3, 1, 2);
    // [3 1 2] around 2 (1); [7 10 9 8] around 8 (7); [9 10] around 10 (9).
    const questions = choices(sortQuestions(run(input), "quick"));
    expect(questions.map((q) => q.answer)).toEqual([5, 3, 1, 1, 1]);
    expect(questions[0].prompt).toContain("smaller than the pivot, 6");
  });

  it.each(orders)("on %s input: the pivot lands at the counted position, asked with the partition lit", (order) => {
    const timeline = run(generateItems(10, order, seededRandom(7)));
    const questions = choices(sortQuestions(timeline, "quick"));
    expect(questions.length).toBeGreaterThan(0);
    expectFairOptions(questions);
    const last = timeline.frameAt(timeline.length - 1);
    questions.forEach((q) => {
      // On screen: the partition in focus and its pivot marked, before anything is compared against it.
      const shown = timeline.frameAt(q.at - 1);
      expect(shown.pivot).not.toBeNull();
      expect(shown.focus.length).toBeGreaterThan(1);
      const pivot = shown.pivot!;
      expect(q.labels).toEqual([pivot]);
      const positions = shown.focus.map((id) => shown.order.indexOf(id));
      const lo = Math.min(...positions);
      // Counted from the values on screen…
      const smaller = shown.focus.filter((id) => timeline.values[id] < timeline.values[pivot]).length;
      expect(q.answer).toBe(smaller);
      // …and where the pivot really ends up.
      expect(last.order.indexOf(pivot) - lo).toBe(q.answer);
    });
    // One question per partition with more than one element: each one gets a pivot.
    const partitions = new Set<number>();
    for (let f = 0; f < timeline.length; f++) {
      const pivot = timeline.frameAt(f).pivot;
      if (pivot !== null) partitions.add(pivot);
    }
    expect(questions).toHaveLength(partitions.size);
  });
});

describe("guess mode questions for shell sort", () => {
  const run = (items: number[]) => new Timeline(sortAlgorithms.shell, items);

  it("asks how many gap-steps every other picked-up value moves back, in the gap passes", () => {
    // Worked by hand, every pick-up: gap 5 moves 0, 1, 0, 0, 0 (only 2 passes 3); gap 2 moves
    // 0, 1, 2, 0, 3, 0, 3, 2 (1 passes 2; 5 passes 9, 7; 3 passes 9, 7, 5; 4 passes 9, 7, 5; 6 passes 10, 8).
    // It asks about the 1st, 3rd, 5th… of each pass: 8, 10, 6 at gap 5; 9, 5, 3, 4 at gap 2.
    // The last pass (gap 1) is plain insertion sort and asks nothing.
    const questions = choices(sortQuestions(run(input), "shell"));
    expect(questions.map((q) => q.answer)).toEqual([0, 0, 0, 0, 2, 3, 3]);
    expect(questions.map((q) => q.prompt.match(/does (\d+)/)![1])).toEqual(["8", "10", "6", "9", "5", "3", "4"]);
    expect(questions[4].prompt).toBe("Gap 2: how many gap-steps does 5 move back?");
  });

  it.each(orders.flatMap((order) => [10, 20].map((size) => [order, size] as const)))(
    "on %s input with %i items: the value really moves that many gap-steps, asked just before it's picked up",
    (order, size) => {
    const timeline = run(generateItems(size, order, seededRandom(7)));
    const questions = choices(sortQuestions(timeline, "shell"));
    expectFairOptions(questions);
    const perGap = new Map<number, number>();
    questions.forEach((q) => {
      // The asked-about frame lights the gap group and compares the picked value with the one a gap
      // before it. Its narration says which is smaller, so the question comes before it shows.
      const pickup = timeline.frameAt(q.at);
      const [a, b] = pickup.active.map((id) => pickup.order.indexOf(id));
      const gap = Math.abs(a - b);
      expect(gap).toBeGreaterThan(1);
      const from = Math.max(a, b);
      // A gap pass picks up the values at gap, gap + 1, … in turn; it asks about every other one.
      expect((from - gap) % 2).toBe(0);
      perGap.set(gap, (perGap.get(gap) ?? 0) + 1);
      const picked = pickup.order[from];
      expect(timeline.frameAt(q.at - 1).active).not.toContain(picked);
      expect(q.prompt).toBe(`Gap ${gap}: how many gap-steps does ${timeline.values[picked]} move back?`);
      // The picked value and the group it moves back through are labelled with their values.
      expect(pickup.temp).toContain(picked);
      expect([...q.labels!].sort()).toEqual([...pickup.temp].sort());
      // It's done moving when the next value is picked up (the lit group changes) or the run ends.
      const lit = [...pickup.temp].sort().join();
      let end = q.at + 1;
      while (end < timeline.length - 1 && [...timeline.frameAt(end).temp].sort().join() === lit) end++;
      const to = timeline.frameAt(end - 1).order.indexOf(picked);
      expect((from - to) % gap).toBe(0);
      expect(q.answer).toBe((from - to) / gap);
    });
    // Each gap pass bigger than 1 picks up size - gap values and asks about half of them, rounded up.
    const expected = new Map<number, number>();
    for (let gap = Math.floor(size / 2); gap > 1; gap = Math.floor(gap / 2))
      expected.set(gap, Math.ceil((size - gap) / 2));
    expect(perGap).toEqual(expected);
  },
  );
});
