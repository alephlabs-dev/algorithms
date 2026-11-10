import { describe, expect, it } from "vitest";
import { mix, type RGB } from "./theme";

describe("mix", () => {
  const a: RGB = [10, 20, 30];
  const b: RGB = [200, 100, 31];

  it("gives a at t = 0 and b at t = 1", () => {
    expect(mix(a, b, 0)).toEqual(a);
    expect(mix(a, b, 1)).toEqual(b);
  });

  it("gives the midpoint of each channel at t = 0.5", () => {
    expect(mix(a, b, 0.5)).toEqual([105, 60, 30.5]);
  });

  it("neither rounds nor clamps", () => {
    expect(mix([0, 0, 0], [1, 2, 3], 0.25)).toEqual([0.25, 0.5, 0.75]);
    expect(mix([0, 0, 0], [100, 200, 255], 2)).toEqual([200, 400, 510]);
    expect(mix([50, 50, 50], [100, 100, 100], -1)).toEqual([0, 0, 0]);
  });
});
