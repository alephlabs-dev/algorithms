import { describe, expect, it } from "vitest";
import { circleOptions, type Point } from "@/fourier";
import { routePath } from "@/routes";
import { readLocation } from "@/urlState";
import { fourierSlice as slice, type FourierState } from "./fourier.slice";
import type { SliceContext } from "./slice";

const ctx: SliceContext = {
  view: "single",
  isModuleStart: false,
  speedPreset: "1x",
  isMobile: false,
  isPortrait: false,
};
const at = (path: string, search = "") => slice.hydrate(readLocation(path, search), ctx);
const apply = (s: FourierState, patch: Partial<FourierState> | null) => ({ ...s, ...patch });
const settings = ({ algorithm, circles, shape, path }: FourierState) => ({ algorithm, circles, shape, path });

const withCircles = (circles: number) => apply(at("/fourier"), slice.actions.setCircles(at("/fourier"), ctx, circles));
const drawn = (path: Point[]) => {
  const s = at("/fourier/epicycles");
  return apply(s, slice.actions.setPath(s, ctx, path));
};

describe("fourier slice", () => {
  it("opens on the square wave with its default circles, and its run is ready", () => {
    const s = at("/fourier");
    expect(settings(s)).toEqual({ algorithm: "square", circles: 5, shape: "heart", path: null });
    expect(s.run.length).toBeGreaterThan(1);
  });

  it("survives its own link", () => {
    const triangle = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    for (const s of [at("/fourier/sawtooth"), withCircles(25), drawn(triangle)]) {
      const path = routePath(slice.engine.route(s, ctx));
      const reopened = at(path, slice.engine.search(s, ctx));
      expect(routePath(slice.engine.route(reopened, ctx))).toBe(path);
      expect({ ...settings(reopened), path: null }).toEqual({ ...settings(s), path: null });
      expect(reopened.path).toEqual(s.path);
      // Opening the link writes the same link back, so the address bar doesn't drift (#132).
      expect(slice.engine.search(reopened, ctx)).toBe(slice.engine.search(s, ctx));
    }
  });

  it("picking a series keeps the circles when they fit it, and takes its default when they don't", () => {
    const wave = withCircles(25);
    expect(slice.pick(wave, ctx, "triangle").circles).toBe(25);
    const drawing = slice.pick(withCircles(2), ctx, "epicycles");
    expect(drawing.circles).toBe(50);
    expect(drawing.run).not.toBe(wave.run);
  });

  it("choosing to draw clears the last hand-drawn shape; a ready-made one keeps it", () => {
    const s = drawn([{ x: 0, y: 0 }]);
    expect(s.shape).toBe("custom");
    expect(s.path).toHaveLength(64);
    expect(slice.actions.setShape(s, ctx, "custom")?.path).toBeNull();
    expect(slice.actions.setShape(s, ctx, "star")?.path).toEqual(s.path);
  });

  it("new input adds circles, wrapping back to the fewest", () => {
    let s = at("/fourier");
    const seen = [s.circles];
    for (let i = 0; i < circleOptions.wave.length; i++) {
      s = apply(s, slice.newInput(s, ctx));
      seen.push(s.circles);
    }
    expect(seen).toEqual([5, 10, 25, 1, 2, 3, 5]);
  });
});
