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
  let focus: number[] = [];
  let pivot: number | null = null;
  let hop: number | null = null;
  const done = new Set<number>();
  const stats = { comparisons: 0, swaps: 0, writes: 0 };

  const valuesAt = (indices: number[]) => indices.map((i) => arr[i]);
  const snapshot = (): Frame => ({
    items: [...arr],
    // A value that just reached its final place stops being "compared".
    active: active.filter((value) => !done.has(value)),
    temp,
    done: [...done],
    focus,
    pivot,
    hop,
    stats: { ...stats },
  });

  const frames = [snapshot()];

  for (const step of algorithm(arr)) {
    hop = null;
    switch (step.type) {
      case "compare":
        stats.comparisons++;
        active = valuesAt([step.i, step.j]);
        break;
      case "swap":
        stats.swaps++;
        [arr[step.i], arr[step.j]] = [arr[step.j], arr[step.i]];
        // The value that moved right hops over the other one.
        hop = arr[Math.max(step.i, step.j)];
        break;
      case "overwrite":
        stats.writes++;
        arr.splice(step.start, step.values.length, ...step.values);
        active = [];
        if (step.hop !== undefined) hop = arr[step.hop];
        break;
      case "done":
        valuesAt(step.indices).forEach((value) => done.add(value));
        break;
      case "highlight":
        break;
    }
    if (step.active) active = valuesAt(step.active);
    if (step.temp) temp = valuesAt(step.temp);
    if (step.focus) focus = valuesAt(step.focus);
    if (step.pivot !== undefined)
      pivot = step.pivot === null ? null : arr[step.pivot];
    frames.push(snapshot());
  }

  active = [];
  temp = [];
  focus = [];
  pivot = null;
  hop = null;
  arr.forEach((value) => done.add(value));
  frames.push(snapshot());

  return frames;
};

export const range = (start: number, end: number) =>
  Array.from({ length: Math.max(0, end - start) }, (_, k) => start + k);
