import { describe, expect, it } from "vitest";
import { deltaE2000Lab, rgbToLab, type Lab } from "./colorDifference";

describe("CIEDE2000", () => {
  // Test data from Sharma, Wu and Dalal (2005), "The CIEDE2000 Color-Difference Formula", table 1.
  const sharma: [Lab, Lab, number][] = [
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, 0, 0], [50, -1, 2], 2.3669],
    [[50, 2.49, -0.001], [50, -2.49, 0.0011], 7.2195],
    [[50, 2.5, 0], [73, 25, -18], 27.1492],
    [[50, 2.5, 0], [56, -27, -3], 31.903],
    [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
    [[22.7233, 20.0904, -46.694], [23.0331, 14.973, -42.5619], 2.0373],
    [[90.9257, -0.5406, -0.9208], [88.6381, -0.8985, -0.7239], 1.5381],
  ];
  for (const [a, b, expected] of sharma)
    it(`Lab(${a.join(", ")}) vs Lab(${b.join(", ")}) is ${expected}`, () => {
      expect(deltaE2000Lab(a, b)).toBeCloseTo(expected, 4);
      expect(deltaE2000Lab(b, a)).toBeCloseTo(expected, 4);
    });

  it("converts sRGB to CIELAB (D65)", () => {
    const close = (lab: Lab, expected: Lab) => lab.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 1));
    close(rgbToLab([255, 255, 255]), [100, 0, 0]);
    close(rgbToLab([0, 0, 0]), [0, 0, 0]);
    close(rgbToLab([255, 0, 0]), [53.24, 80.09, 67.2]);
    close(rgbToLab([0, 0, 255]), [32.3, 79.19, -107.86]);
  });
});
