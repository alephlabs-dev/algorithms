import { describe, expect, it } from "vitest";
import type { StoreState } from "@/store";
import { stepsPerSecond } from "@/utils/speed";
import { selectSpeed } from "./engine";

type Run = { length: number; totalOps: number };

// Only what the speed reads: the preset, the module and view, and how long the runs are.
type Fields = { run: Run; raceRuns?: Run[] } & Partial<StoreState>;
const sorting = ({ run, raceRuns = [], ...shared }: Fields) =>
  ({
    module: "sorting",
    view: "single",
    speedPreset: "1x",
    ...shared,
    sorting: { run, raceRuns },
  }) as unknown as StoreState;

const run = (steps: number): Run => ({ length: steps + 1, totalOps: steps });

/** Seconds the run on stage takes to play at the selected speed. */
const secondsFor = (s: StoreState, steps: number) => steps / stepsPerSecond(selectSpeed(s));

describe("selectSpeed", () => {
  it("plays a long run on stage in four minutes at 1×", () => {
    // Bubble sort on 400 items is about 120,000 steps.
    const s = sorting({ run: run(120_000) });
    expect(secondsFor(s, 120_000)).toBeCloseTo(240);
  });

  it("plays twice as fast at 2× on the same run", () => {
    const long = run(120_000);
    expect(secondsFor(sorting({ run: long, speedPreset: "2x" }), 120_000)).toBeCloseTo(120);
    expect(secondsFor(sorting({ run: long, speedPreset: "0.5x" }), 120_000)).toBeCloseTo(480);
  });

  it("keeps a short run at the default pace", () => {
    // Selection sort on 40 items is about 850 steps: four minutes would be far too slow to need speeding up.
    const s = sorting({ run: run(850) });
    expect(stepsPerSecond(selectSpeed(s))).toBeCloseTo(4.6, 1);
  });

  it("times a race by its slowest lane, in thirty seconds", () => {
    const s = sorting({
      view: "race",
      run: run(10),
      raceRuns: [run(2_000), run(7_000), run(500)],
    });
    expect(secondsFor(s, 7_000)).toBeCloseTo(30);
  });

  it("uses each module's own pace", () => {
    // A search reads best brisk: twenty seconds for the same number of steps.
    const s = {
      module: "pathfinding",
      view: "single",
      speedPreset: "1x",
      pathfinding: { run: run(4_000) },
    } as unknown as StoreState;
    expect(secondsFor(s, 4_000)).toBeCloseTo(20);
  });
});
