import { describe, expect, it } from "vitest";
import { autoSpeed, DEFAULT_SPEED, speedFor, speedForStepsPerSecond, stepsPerSecond } from "./speed";

describe("speed", () => {
  it("converts between slider position and steps per second", () => {
    for (const speed of [0, 0.2, 0.5, 1]) {
      expect(speedForStepsPerSecond(stepsPerSecond(speed))).toBeCloseTo(speed);
    }
    expect(speedForStepsPerSecond(0.1)).toBe(0);
    expect(speedForStepsPerSecond(1e9)).toBe(1);
  });

  it("keeps the default for short runs", () => {
    // 40 items with selection sort is ~850 steps.
    expect(autoSpeed(850, "single")).toBe(DEFAULT_SPEED);
  });

  it("speeds up long runs so they finish within the target time", () => {
    const steps = 120_000; // bubble sort on 400 items
    expect(steps / stepsPerSecond(autoSpeed(steps, "single"))).toBeCloseTo(240);
    const ops = 7_000; // bubble sort on 100 items, racing
    expect(ops / stepsPerSecond(autoSpeed(ops, "race"))).toBeCloseTo(30);
  });

  it("presets are multiples of the run's own pace", () => {
    const steps = 5_000;
    const base = stepsPerSecond(speedFor("1x", steps, "single"));
    expect(stepsPerSecond(speedFor("2x", steps, "single"))).toBeCloseTo(base * 2);
    expect(stepsPerSecond(speedFor("0.5x", steps, "single"))).toBeCloseTo(base / 2);
    expect(speedFor("max", steps, "single")).toBe(1);
  });
});
