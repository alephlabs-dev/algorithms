import { describe, expect, it } from "vitest";
import { createAppStore } from "@/appStore";
import { href, routePath } from "@/routes";
import { routeIn } from "@/modules/engine";
import { linkFor, readLocation } from "@/urlState";
import { structuresSlice as slice, type StructuresState } from "./slice";
import type { SliceContext } from "@/modules/slice";

const single: SliceContext = {
  view: "single",
  isModuleStart: false,
  speedPreset: "1x",
  isMobile: false,
  isPortrait: false,
};
const race: SliceContext = { ...single, view: "race" };
const at = (path: string, search = "", ctx = single) => slice.hydrate(linkFor(readLocation(path, search), "structures"), ctx);
const apply = (s: StructuresState, patch: Partial<StructuresState> | null) => ({ ...s, ...patch });

describe("structures slice", () => {
  it("opens on AVL with the example values, and no race outside race view", () => {
    const s = at("/structures");
    expect([s.algorithm, s.preset, s.size]).toEqual(["avl", "example", "medium"]);
    expect(s.ops.length).toBeGreaterThan(0);
    expect(s.raceRuns).toEqual([]);
    expect(at("/structures/race", "", race).raceRuns).toHaveLength(2);
  });

  it("survives its own link", () => {
    const start = at("/structures");
    const s = apply(start, slice.actions.runOperation(start, single, { kind: "insert", value: 7 }));
    const reopened = at(routePath(routeIn("structures", slice.current(s), single)), slice.engine.search(s, single));
    const settings = ({ algorithm, preset, size, ops }: StructuresState) => ({ algorithm, preset, size, ops });
    expect(settings(reopened)).toEqual(settings(s));
  });

  it("builds race runs for race view and drops them for single view", () => {
    const s = at("/structures");
    const racing = apply(s, slice.forView!(s, race));
    expect(racing.raceRuns.map((r) => r.algorithm)).toEqual(["bst", "avl"]);
    expect(slice.engine.lastIndex(racing, "race")).toBe(Math.max(...racing.raceRuns.map((r) => r.frames.length - 1)));
    expect(apply(racing, slice.forView!(racing, single)).raceRuns).toEqual([]);
  });

  it("new values replace the operations and start the stage fresh; an operation keeps it", () => {
    const s = at("/structures");
    const renewed = apply(s, slice.newInput(s, single));
    expect(renewed.inputId).toBe(s.inputId + 1);
    const grown = apply(s, slice.actions.runOperation(s, single, { kind: "insert", value: 99 }));
    expect(grown.inputId).toBe(s.inputId);
    expect(grown.ops).toEqual([...s.ops, { kind: "insert", value: 99 }]);
  });
});

describe("structures in the store", () => {
  const storeAt = (path: string) =>
    createAppStore({ url: readLocation(path, ""), isMobile: false, isPortrait: false, theme: "dark" });

  it("one more operation plays just that operation", () => {
    const app = storeAt(href({ module: "structures", page: "algorithm", algorithm: "avl" }));
    app.getState().actions.structures.runOperation({ kind: "insert", value: 99 });
    const { frameIndex, isPlaying, structures } = app.getState();
    expect(frameIndex).toBe(structures.run.opStarts[structures.run.opStarts.length - 1]);
    expect(frameIndex).toBeGreaterThan(0);
    expect(isPlaying).toBe(true);
  });

  it("in a race, one more operation replays everything so both trees start even", () => {
    const app = storeAt(href({ module: "structures", page: "race" }));
    app.getState().actions.structures.runOperation({ kind: "insert", value: 99 });
    const { frameIndex, isPlaying, structures } = app.getState();
    expect(frameIndex).toBe(0);
    expect(isPlaying).toBe(true);
    expect(structures.raceRuns).toHaveLength(2);
  });
});
