import { describe, expect, it } from "vitest";
import { generateUniqueRandomItems } from "@/utils/generateItems";
import { Timeline, pseudocode, range, sortAlgorithms } from ".";
import type { Algorithm } from "@/types";
import type { Frame } from "./types";

const ascending = (arr: readonly number[]) => [...arr].sort((a, b) => a - b);

const inputs: Record<string, number[]> = {
  random: generateUniqueRandomItems(40),
  sorted: range(1, 31),
  reversed: range(1, 31).reverse(),
  "repeated values": [3, 1, 2, 3, 1, 2, 3, 1, 2, 2, 1, 3],
  "two items": [9, 3],
  "one item": [7],
  empty: [],
};

const allFrames = (timeline: Timeline): Frame[] =>
  Array.from({ length: timeline.length }, (_, k) => timeline.frameAt(k));

describe.each(Object.entries(sortAlgorithms))("%s sort", (name, algorithm) => {
  const code = pseudocode[name as Algorithm];

  it("has short pseudocode that reads well line by line", () => {
    expect(code.length).toBeGreaterThanOrEqual(6);
    expect(code.length).toBeLessThanOrEqual(14);
    for (const line of code) expect(line.length).toBeLessThanOrEqual(40);
  });

  it("annotates steps with pseudocode lines", () => {
    const frames = allFrames(new Timeline(algorithm, inputs.random));
    expect(frames.some((frame) => frame.line !== null)).toBe(true);
  });

  describe.each(Object.entries(inputs))("on %s input", (_, input) => {
    const timeline = new Timeline(algorithm, input);
    const frames = allFrames(timeline);
    const valuesOf = (frame: Frame) => frame.order.map((id) => timeline.values[id]);
    const first = frames[0];
    const last = frames[frames.length - 1];
    const sorted = ascending(input);

    it("only points at lines that exist in its pseudocode", () => {
      for (const { line } of frames) {
        if (line !== null) expect(line).toBeLessThan(code.length);
        if (line !== null) expect(line).toBeGreaterThanOrEqual(0);
      }
    });

    it("starts from the input with nothing highlighted", () => {
      expect(valuesOf(first)).toEqual(input);
      expect(first.active).toEqual([]);
      expect(first.temp).toEqual([]);
      expect(first.done).toEqual([]);
      expect(first.stats).toEqual({ comparisons: 0, swaps: 0, writes: 0 });
    });

    it("ends sorted with every item done", () => {
      expect(valuesOf(last)).toEqual(sorted);
      expect(ascending(last.done)).toEqual(range(0, input.length));
      expect(last.active).toEqual([]);
      expect(last.temp).toEqual([]);
      expect(last.focus).toEqual([]);
      expect(last.pivot).toBeNull();
    });

    it("keeps every frame a permutation of the input", () => {
      for (const frame of frames) {
        expect(ascending(frame.order)).toEqual(range(0, input.length));
      }
    });

    it("only marks items done once they are in their final place", () => {
      for (const frame of frames) {
        for (const id of frame.done) {
          expect(timeline.values[id]).toBe(sorted[frame.order.indexOf(id)]);
        }
      }
    });

    it("never shows an item as both compared and done", () => {
      for (const { active, done } of frames) {
        for (const id of active) expect(done).not.toContain(id);
      }
    });

    it("only hops items that actually moved", () => {
      for (let k = 1; k < frames.length; k++) {
        const { hop, order } = frames[k];
        if (hop === null) continue;
        expect(order.indexOf(hop)).not.toBe(frames[k - 1].order.indexOf(hop));
      }
    });

    it("keeps the pivot inside the focused range", () => {
      for (const { pivot, focus } of frames) {
        if (pivot !== null) expect(focus).toContain(pivot);
      }
    });

    it("never un-marks a done item and never decreases a counter", () => {
      for (let k = 1; k < frames.length; k++) {
        const prev = frames[k - 1];
        const curr = frames[k];
        expect(curr.done).toEqual(expect.arrayContaining(prev.done));
        expect(curr.stats.comparisons).toBeGreaterThanOrEqual(prev.stats.comparisons);
        expect(curr.stats.swaps).toBeGreaterThanOrEqual(prev.stats.swaps);
        expect(curr.stats.writes).toBeGreaterThanOrEqual(prev.stats.writes);
      }
    });
  });

  it("rebuilds any frame from checkpoints exactly as playing forward does", () => {
    // Big enough to cross several checkpoints.
    const input = range(1, 121).reverse();
    const sequential = allFrames(new Timeline(algorithm, input));
    const jumping = new Timeline(algorithm, input);
    const order = [...sequential.keys()].sort(() => Math.random() - 0.5);
    for (const k of order.slice(0, 200)) {
      expect(jumping.frameAt(k)).toEqual(sequential[k]);
    }
  });
});

describe("heap sort highlights", () => {
  it("starts each sift-down with nothing lit as compared (the last pair doesn't linger)", () => {
    const timeline = new Timeline(sortAlgorithms.heap, [7, 3, 9, 1, 5, 8, 2, 10, 4, 6]);
    // Lines 2 and 6 of the pseudocode are "sift_down(...)": a new sift-down begins.
    const starts = Array.from({ length: timeline.length }, (_, k) => k).filter((k) => {
      const step = timeline.stepAt(k);
      return step?.type === "highlight" && (step.line === 2 || step.line === 6);
    });
    expect(starts.length).toBeGreaterThan(5);
    for (const k of starts) expect(timeline.frameAt(k).active).toEqual([]);
  });
});

describe("step kinds", () => {
  it("labels every frame after the first, and tells line-only steps apart", () => {
    const timeline = new Timeline(sortAlgorithms.heap, [5, 3, 8, 1, 9, 2]);
    expect(timeline.kindAt(0)).toBeNull();
    expect(timeline.kindAt(timeline.length - 1)).toBe("finish");
    const kinds = new Set(Array.from({ length: timeline.length - 1 }, (_, k) => timeline.kindAt(k + 1)));
    expect(kinds).toContain("compare");
    expect(kinds).toContain("swap");
    // Heap sort has steps that only move the pseudocode highlight.
    expect(kinds).toContain("line");
    for (let k = 1; k < timeline.length; k++) {
      if (timeline.kindAt(k) !== "line") continue;
      const [a, b] = [timeline.frameAt(k - 1), timeline.frameAt(k)];
      expect(b.order).toEqual(a.order);
      expect(b.active).toEqual(a.active);
      expect(b.done).toEqual(a.done);
    }
  });
});

describe("operation clock", () => {
  it("maps operation counts to frames", () => {
    const timeline = new Timeline(sortAlgorithms.bubble, [3, 2, 1]);
    const { comparisons, swaps, writes } = timeline.frameAt(timeline.length - 1).stats;
    expect(timeline.totalOps).toBe(comparisons + swaps + writes);
    expect(timeline.frameIndexAtOps(timeline.totalOps)).toBe(timeline.length - 1);
    for (let ops = 0; ops < timeline.totalOps; ops++) {
      const { stats } = timeline.frameAt(timeline.frameIndexAtOps(ops));
      expect(stats.comparisons + stats.swaps + stats.writes).toBe(ops);
    }
  });
});

const statsFor = (name: keyof typeof sortAlgorithms, input: number[]) => {
  const timeline = new Timeline(sortAlgorithms[name], input);
  return timeline.frameAt(timeline.length - 1).stats;
};

describe("complexity matches the descriptions", () => {
  const n = 30;
  const sorted = range(1, n + 1);
  const reversed = [...sorted].reverse();
  const quadratic = (n * (n - 1)) / 2;

  it("bubble sort is O(n) on sorted input thanks to the early exit", () => {
    expect(statsFor("bubble", sorted)).toEqual({ comparisons: n - 1, swaps: 0, writes: 0 });
  });

  it("insertion sort is O(n) on sorted input", () => {
    expect(statsFor("insertion", sorted)).toEqual({ comparisons: n - 1, swaps: 0, writes: 0 });
  });

  it("insertion sort does n(n-1)/2 swaps on reversed input", () => {
    expect(statsFor("insertion", reversed).swaps).toBe(quadratic);
  });

  it("selection sort always does n(n-1)/2 comparisons and at most n-1 swaps", () => {
    for (const input of [sorted, reversed, generateUniqueRandomItems(n)]) {
      const stats = statsFor("selection", input);
      expect(stats.comparisons).toBe(quadratic);
      expect(stats.swaps).toBeLessThanOrEqual(n - 1);
    }
  });

  it("quick sort with a last-element pivot degrades to O(n²) on reversed input", () => {
    expect(statsFor("quick", reversed).comparisons).toBe(quadratic);
  });

  it("merge sort stays within n·log2(n) comparisons and does no swaps", () => {
    for (const input of [sorted, reversed, generateUniqueRandomItems(n)]) {
      const stats = statsFor("merge", input);
      expect(stats.comparisons).toBeLessThanOrEqual(n * Math.ceil(Math.log2(n)));
      expect(stats.swaps).toBe(0);
    }
  });

  it("cocktail sort is O(n) on sorted input thanks to the early exit", () => {
    expect(statsFor("cocktail", sorted)).toEqual({ comparisons: n - 1, swaps: 0, writes: 0 });
  });

  it("heap sort stays within 2·n·log2(n) comparisons", () => {
    for (const input of [sorted, reversed, generateUniqueRandomItems(n)]) {
      expect(statsFor("heap", input).comparisons).toBeLessThanOrEqual(2 * n * Math.log2(n));
    }
  });

  it("shell sort needs fewer swaps than insertion sort on reversed input", () => {
    expect(statsFor("shell", reversed).swaps).toBeLessThan(statsFor("insertion", reversed).swaps);
  });

  it("radix sort never compares and writes every item once per digit", () => {
    for (const input of [reversed, [5, 120, 7, 7, 999, 1, 40, 120]]) {
      const digits = String(Math.max(...input)).length;
      const stats = statsFor("radix", input);
      expect(stats.comparisons).toBe(0);
      expect(stats.writes).toBe(input.length * digits);
    }
  });

  it.each(["merge", "radix", "insertion", "bubble", "cocktail"] as const)(
    "%s sort is stable",
    (name) => {
      // Equal values must keep their original order (ids increase within a value).
      const input = [2, 1, 12, 2, 1, 2, 1, 3, 3, 1, 12, 21];
      const timeline = new Timeline(sortAlgorithms[name], input);
      const { order } = timeline.frameAt(timeline.length - 1);
      for (let k = 1; k < order.length; k++) {
        if (input[order[k]] === input[order[k - 1]]) {
          expect(order[k]).toBeGreaterThan(order[k - 1]);
        }
      }
    }
  );
});
