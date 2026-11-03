import { describe, expect, it } from "vitest";
import { generateUniqueRandomItems } from "@/utils/generateItems";
import { recordFrames, sortAlgorithms } from ".";
import { range } from "./recordFrames";

const ascending = (arr: readonly number[]) => [...arr].sort((a, b) => a - b);

const inputs: Record<string, number[]> = {
  random: generateUniqueRandomItems(40),
  sorted: range(1, 31),
  reversed: range(1, 31).reverse(),
  "two items": [9, 3],
  "one item": [7],
  empty: [],
};

describe.each(Object.entries(sortAlgorithms))("%s sort", (_, algorithm) => {
  describe.each(Object.entries(inputs))("on %s input", (_, input) => {
    const frames = recordFrames(algorithm, input);
    const first = frames[0];
    const last = frames[frames.length - 1];

    it("starts from the input with nothing highlighted", () => {
      expect(first.items).toEqual(input);
      expect(first.active).toEqual([]);
      expect(first.temp).toEqual([]);
      expect(first.done).toEqual([]);
      expect(first.stats).toEqual({ comparisons: 0, swaps: 0, writes: 0 });
    });

    it("ends sorted with every item done", () => {
      expect(last.items).toEqual(ascending(input));
      expect(ascending(last.done)).toEqual(ascending(input));
      expect(last.active).toEqual([]);
      expect(last.temp).toEqual([]);
    });

    it("keeps every frame a permutation of the input", () => {
      for (const frame of frames) {
        expect(ascending(frame.items)).toEqual(ascending(input));
      }
    });

    it("only marks items done once they are in their final place", () => {
      const sorted = ascending(input);
      for (const frame of frames) {
        for (const value of frame.done) {
          expect(frame.items.indexOf(value)).toBe(sorted.indexOf(value));
        }
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
});

const statsFor = (name: keyof typeof sortAlgorithms, input: number[]) => {
  const frames = recordFrames(sortAlgorithms[name], input);
  return frames[frames.length - 1].stats;
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
});
