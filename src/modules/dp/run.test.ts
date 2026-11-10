import { describe, expect, it } from "vitest";
import { seededRandom } from "@/utils/random";
import { alignment, DpRun, keptLetters } from "./run";
import { cleanWord, decodeItems, encodeItems, EXAMPLE_CAPACITY, EXAMPLE_ITEMS, isWord, RACE_CAPACITY, RACE_ITEMS, randomItems } from "./presets";
import { KnapsackRun } from "./knapsack";
import { KnapsackWork, methods } from "./work";
import { MAX_CAPACITY, type Item } from "./types";

describe("DpRun", () => {
  it.each([
    ["KITTEN", "SITTING", 3],
    ["SUNDAY", "SATURDAY", 3],
    ["INTENTION", "EXECUTION", 5],
    ["A", "A", 0],
    ["ABC", "XYZ", 3],
  ])("edit distance %s → %s is %i", (a, b, distance) => {
    const run = new DpRun("edit", a, b);
    expect(run.answer).toBe(distance);
    // The way back spells an alignment with exactly that many edits, turning a into b.
    const columns = alignment(a, b, run.trace);
    expect(columns.filter((c) => c.kind !== "match")).toHaveLength(distance);
    expect(columns.map((c) => c.top ?? "").join("")).toBe(a);
    expect(columns.map((c) => c.bottom ?? "").join("")).toBe(b);
  });

  it.each([
    ["ABCBDAB", "BDCABA", 4],
    ["GATTACA", "TACTAG", 4],
    ["ABC", "XYZ", 0],
  ])("LCS of %s and %s has %i letters", (a, b, length) => {
    const run = new DpRun("lcs", a, b);
    expect(run.answer).toBe(length);
    const letters = keptLetters(a, run.trace);
    expect(letters).toHaveLength(length);
    // A subsequence of both.
    const isSubsequence = (s: string, of: string) => {
      let k = 0;
      for (const ch of of) if (ch === s[k]) k++;
      return k === s.length;
    };
    expect(isSubsequence(letters, a)).toBe(true);
    expect(isSubsequence(letters, b)).toBe(true);
  });

  it("records a frame per cell, then the way back", () => {
    const run = new DpRun("edit", "AB", "CD");
    const types = run.frames.map((f) => f.event.type);
    expect(types.filter((t) => t === "cell")).toHaveLength(4);
    expect(types[0]).toBe("start");
    expect(types[types.length - 1]).toBe("done");
    expect(types.indexOf("trace")).toBeGreaterThan(types.lastIndexOf("cell"));
  });
});

describe("KnapsackRun", () => {
  // Brute force: every subset that fits.
  const best = (items: Item[], capacity: number) => {
    let top = 0;
    for (let mask = 0; mask < 1 << items.length; mask++) {
      let w = 0;
      let v = 0;
      items.forEach((it, k) => {
        if (mask & (1 << k)) {
          w += it.weight;
          v += it.value;
        }
      });
      if (w <= capacity) top = Math.max(top, v);
    }
    return top;
  };

  it("finds the best value, and the way back picks items worth it that fit", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const random = seededRandom(seed);
      const items = randomItems(3 + (seed % 6), random);
      const capacity = 1 + Math.floor(random() * MAX_CAPACITY);
      const run = new KnapsackRun(items, capacity);
      expect(run.answer).toBe(best(items, capacity));
      const chosen = run.chosen.map((k) => items[k]);
      expect(chosen.reduce((s, it) => s + it.value, 0)).toBe(run.answer);
      expect(chosen.reduce((s, it) => s + it.weight, 0)).toBeLessThanOrEqual(capacity);
    }
  });

  it("solves the textbook example with B and C", () => {
    const run = new KnapsackRun(EXAMPLE_ITEMS, EXAMPLE_CAPACITY);
    expect(run.answer).toBe(9);
    expect(run.chosen).toEqual([1, 2]);
  });

  it("links round-trip", () => {
    expect(decodeItems(encodeItems(EXAMPLE_ITEMS))).toEqual(EXAMPLE_ITEMS);
    expect(decodeItems("3x4.bad")).toBeNull();
  });
});

describe("KnapsackWork", () => {
  it("gets the same answer three ways; only plain recursion repeats work", () => {
    const items = randomItems(8, seededRandom(4));
    const [table, memo, recursion] = methods.map((m) => new KnapsackWork(m, items, 10));
    expect(memo.answer).toBe(table.answer);
    expect(recursion.answer).toBe(table.answer);
    expect(table.calls).toHaveLength(9 * 11);
    expect(table.calls.some((c) => c.repeat)).toBe(false);
    expect(memo.calls.filter((c) => c.repeat && !c.cached)).toHaveLength(0);
    expect(recursion.calls.filter((c) => c.repeat).length).toBeGreaterThan(0);
    expect(recursion.length).toBeGreaterThan(memo.length);
  });
});

describe("the race example", () => {
  it("is big enough for plain recursion to lose", () => {
    const [table, , recursion] = methods.map((m) => new KnapsackWork(m, RACE_ITEMS, RACE_CAPACITY));
    expect(recursion.length).toBeGreaterThan(2 * table.length);
  });
});

describe("words", () => {
  it("keep Ñ and accented letters, upper case, and drop anything that isn't a letter", () => {
    expect(cleanWord("año")).toBe("AÑO");
    expect(cleanWord("café!")).toBe("CAFÉ");
    expect(cleanWord("pingüino 2")).toBe("PINGÜINO");
    // An accent typed as its own mark joins its letter, and counts as one.
    expect(cleanWord("café")).toBe("CAFÉ");
    expect(cleanWord("murciélagos")).toBe("MURCIÉLAGO");
    expect(isWord("AÑO")).toBe(true);
    expect(isWord("A1")).toBe(false);
    expect(isWord("")).toBe(false);
  });

  it("work out edit distance with them", () => {
    expect(new DpRun("edit", "AÑO", "ANO").answer).toBe(1);
  });
});
