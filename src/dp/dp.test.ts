import { describe, expect, it } from "vitest";
import { alignment, DpRun, keptLetters } from ".";

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
