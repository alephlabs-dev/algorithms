import { describe, expect, it } from "vitest";
import { MAX_QUESTIONS, spread, type Candidate } from "./spread";

/** One candidate per frame from 1 to `length - 1`, the k-th at frame k. */
const every = (length: number, preferred: (k: number) => boolean = () => false): Candidate[] =>
  Array.from({ length: length - 1 }, (_, i) => ({ at: i + 1, k: i + 1, preferred: preferred(i + 1) }));

describe("spread: which candidates guess mode asks about", () => {
  it("asks at most ten, one per tenth of the run, across the whole run", () => {
    const picked = spread(every(1000), 1000, 3);
    expect(picked).toHaveLength(MAX_QUESTIONS);
    picked.forEach((c, w) => {
      expect(c.at).toBeGreaterThanOrEqual(w * 100);
      expect(c.at).toBeLessThan((w + 1) * 100);
    });
  });

  it("keeps picks at least `gap` moments apart, even in a short run", () => {
    const picked = spread(every(12), 12, 3);
    expect(picked.map((c) => c.k)).toEqual([1, 4, 7, 10]);
  });

  it("takes the preferred candidate of a stretch over its first", () => {
    const picked = spread(every(100, (k) => k % 10 === 7), 100, 3);
    expect(picked.map((c) => c.k)).toEqual([7, 17, 27, 37, 47, 57, 67, 77, 87, 97]);
  });

  it("asks nothing in a stretch without candidates", () => {
    const late = every(100).filter((c) => c.at >= 50);
    expect(spread(late, 100, 3).map((c) => c.at)).toEqual([50, 60, 70, 80, 90]);
  });

  it("skips candidates `allow` turns down, given the picks so far", () => {
    // Odd moments only right after an even one: never two odd picks in a row.
    const picked = spread(every(100), 100, 1, {
      allow: (c, so) => c.k % 2 === 0 || (so.length > 0 && so[so.length - 1].k % 2 === 0),
    });
    expect(picked.map((c) => c.k)).toEqual([2, 10, 20, 30, 40, 50, 60, 70, 80, 90]);
  });
});
