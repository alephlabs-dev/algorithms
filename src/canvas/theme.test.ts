import { describe, expect, it } from "vitest";
import { css, inkOn, luminance, mix, type RGB } from "./theme";

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

describe("css", () => {
  it("truncates each channel and keeps the alpha", () => {
    expect(css([10.9, 20.5, 30.1])).toBe("rgb(10 20 30 / 1)");
    expect(css([255, 0, 128], 0.4)).toBe("rgb(255 0 128 / 0.4)");
  });
});

describe("luminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(luminance([0, 0, 0])).toBe(0);
    expect(luminance([255, 255, 255])).toBeCloseTo(1, 10);
  });
});

describe("inkOn", () => {
  const p = { ink: [240, 240, 240] as RGB, background: [10, 10, 10] as RGB };

  it("picks whichever of ink and background contrasts more with the fill", () => {
    expect(inkOn([20, 20, 20], p)).toBe(p.ink);
    expect(inkOn([230, 230, 230], p)).toBe(p.background);
  });
});
