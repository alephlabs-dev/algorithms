import { describe, expect, it } from "vitest";
import { pseudocode, sortAlgorithms } from "./generators";
import { Timeline } from "./timeline";
import { narrate } from "./narrate";

describe("narrate", () => {
  const timeline = new Timeline(sortAlgorithms.quick, [3, 1, 2]);
  const lines = pseudocode.quick;

  it("invites to start before the first step and celebrates the end", () => {
    expect(narrate(timeline, 0, lines)).toMatch(/Press play/);
    expect(narrate(timeline, timeline.length - 1, lines)).toMatch(/Sorted/);
  });

  it("describes every step of every algorithm with a sentence", () => {
    for (const algorithm of Object.keys(sortAlgorithms) as (keyof typeof sortAlgorithms)[]) {
      const t = new Timeline(sortAlgorithms[algorithm], [5, 2, 9, 1, 7, 3]);
      for (let i = 0; i < t.length; i++) {
        expect(narrate(t, i, pseudocode[algorithm])).not.toBe("");
      }
    }
  });

  it("names the pivot when comparing against it", () => {
    const sentences = Array.from({ length: timeline.length }, (_, i) => narrate(timeline, i, lines));
    expect(sentences).toContain("Pick 2 as the pivot.");
    expect(sentences.some((s) => /with the pivot 2: it's (smaller|bigger)/.test(s))).toBe(true);
  });
});
