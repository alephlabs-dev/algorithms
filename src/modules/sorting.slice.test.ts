import { describe, expect, it } from "vitest";
import { createAppStore } from "@/appStore";
import { href, routePath } from "@/routes";
import { routeIn } from "./engine";
import { readLocation } from "@/urlState";
import type { SliceContext } from "./slice";
import { sortingSlice as slice, type SortingState } from "./sorting.slice";

const single: SliceContext = {
  view: "single",
  isModuleStart: false,
  speedPreset: "1x",
  isMobile: false,
  isPortrait: false,
};
const race: SliceContext = { ...single, view: "race" };
const at = (path: string, search = "", ctx = single) => slice.hydrate(readLocation(path, search), ctx);
const apply = (s: SortingState, patch: Partial<SortingState> | null) => ({ ...s, ...patch });

describe("sorting slice", () => {
  it("opens on selection sort over 40 random bars, with four racers ready", () => {
    const s = at("/sorting");
    expect([s.algorithm, s.size, s.inputOrder, s.displayMode]).toEqual(["selection", 40, "random", "bars"]);
    expect(s.run.values).toHaveLength(40);
    expect(s.racers).toHaveLength(4);
    expect(s.raceRuns).toEqual([]);
  });

  it("survives its own link, array included", () => {
    const start = at("/sorting");
    const s = apply(start, slice.actions.setInputOrder(start, single, "reversed"));
    const reopened = at(routePath(routeIn("sorting", slice.current(s), single)), slice.engine.search(s, single));
    const settings = ({ algorithm, size, inputOrder, displayMode, seed, racers }: SortingState) => ({
      algorithm,
      size,
      inputOrder,
      displayMode,
      seed,
      racers,
    });
    expect(settings(reopened)).toEqual(settings(s));
    expect(reopened.run.values).toEqual(s.run.values);
  });

  it("picking an algorithm keeps the array, so algorithms compare on the same data", () => {
    const s = at("/sorting");
    const heap = apply(s, slice.pick(s, single, "heap"));
    expect(heap.algorithm).toBe("heap");
    expect(heap.run.values).toEqual(s.run.values);
    expect(heap.inputId).toBe(s.inputId);
  });

  it("a race runs every racer on the same array", () => {
    const s = at("/sorting");
    const racing = apply(s, slice.forView!(s, race));
    expect(racing.raceRuns).toHaveLength(s.racers.length);
    for (const lane of racing.raceRuns) expect(lane.values).toEqual(s.run.values);
  });

  it("new input is a fresh array of the same size, and the bars remount", () => {
    const s = at("/sorting");
    const renewed = apply(s, slice.newInput(s, single));
    expect(renewed.size).toBe(s.size);
    expect(renewed.seed).not.toBe(s.seed);
    expect(renewed.inputId).toBe(s.inputId + 1);
  });
});

describe("sorting in the store", () => {
  const storeAt = (path: string, isMobile = false) =>
    createAppStore({ url: readLocation(path, ""), isMobile, isPortrait: false, theme: "dark" });

  it("switching to numbers keeps playback when the array fits, and shrinks it when it doesn't", () => {
    const small = storeAt(href({ module: "sorting", page: "algorithm", algorithm: "heap" }));
    small.getState().actions.sorting.setSize(20);
    small.getState().seek(3);
    small.getState().actions.sorting.setDisplayMode("numbers");
    expect([small.getState().sorting.size, small.getState().frameIndex]).toEqual([20, 3]);

    const big = storeAt(href({ module: "sorting", page: "algorithm", algorithm: "heap" }));
    big.getState().seek(3);
    big.getState().actions.sorting.setDisplayMode("numbers");
    expect(big.getState().sorting.displayMode).toBe("numbers");
    expect([big.getState().sorting.size, big.getState().frameIndex]).toEqual([20, 0]);
  });

  it("a phone gets at most 200 bars, even when the screen shrinks later", () => {
    const app = storeAt(href({ module: "sorting", page: "algorithm", algorithm: "heap" }));
    app.getState().actions.sorting.setSize(400);
    app.getState().setIsMobile(true);
    expect(app.getState().sorting.size).toBe(200);
  });
});
