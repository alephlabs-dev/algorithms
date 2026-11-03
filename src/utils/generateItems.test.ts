import { describe, expect, it } from "vitest";
import { generateItems, MAX_ITEM, MIN_ITEM } from "./generateItems";

const countInversions = (arr: number[]) => {
  let inversions = 0;
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++) if (arr[i] > arr[j]) inversions++;
  return inversions;
};

describe("generateItems", () => {
  const orders = ["random", "nearlySorted", "reversed", "sorted"] as const;

  it.each(orders)("%s: returns unique values in range", (order) => {
    const items = generateItems(40, order);
    expect(items).toHaveLength(40);
    expect(new Set(items).size).toBe(40);
    for (const value of items) {
      expect(value).toBeGreaterThanOrEqual(MIN_ITEM);
      expect(value).toBeLessThanOrEqual(MAX_ITEM);
    }
  });

  it("sorted is ascending and reversed is descending", () => {
    expect(countInversions(generateItems(30, "sorted"))).toBe(0);
    expect(countInversions(generateItems(30, "reversed"))).toBe((30 * 29) / 2);
  });

  it("nearly sorted has only a few inversions", () => {
    for (let run = 0; run < 20; run++) {
      // Each neighbour swap adds at most one inversion.
      expect(countInversions(generateItems(30, "nearlySorted"))).toBeLessThanOrEqual(3);
    }
  });
});
