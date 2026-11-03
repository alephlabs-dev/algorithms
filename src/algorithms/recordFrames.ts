import type { Frame, SortAlgorithm } from "./types";

/**
 * Runs an algorithm to completion and returns one frame per step, plus the
 * initial and final frames. Playback, stepping and seeking just pick a frame.
 */
export const recordFrames = (
  algorithm: SortAlgorithm,
  input: readonly number[]
): Frame[] => {
  const arr = [...input];
  let active: number[] = [];
  let temp: number[] = [];
  const done = new Set<number>();
  const stats = { comparisons: 0, swaps: 0, writes: 0 };

  const valuesAt = (indices: number[]) => indices.map((i) => arr[i]);
  const snapshot = (): Frame => ({
    items: [...arr],
    active,
    temp,
    done: [...done],
    stats: { ...stats },
  });

  const frames = [snapshot()];

  for (const step of algorithm(arr)) {
    switch (step.type) {
      case "compare":
        stats.comparisons++;
        active = valuesAt([step.i, step.j]);
        break;
      case "swap":
        stats.swaps++;
        [arr[step.i], arr[step.j]] = [arr[step.j], arr[step.i]];
        break;
      case "overwrite":
        stats.writes++;
        arr.splice(step.start, step.values.length, ...step.values);
        active = [];
        break;
      case "done":
        valuesAt(step.indices).forEach((value) => done.add(value));
        break;
      case "highlight":
        break;
    }
    if (step.active) active = valuesAt(step.active);
    if (step.temp) temp = valuesAt(step.temp);
    frames.push(snapshot());
  }

  active = [];
  temp = [];
  arr.forEach((value) => done.add(value));
  frames.push(snapshot());

  return frames;
};

export const range = (start: number, end: number) =>
  Array.from({ length: Math.max(0, end - start) }, (_, k) => start + k);
