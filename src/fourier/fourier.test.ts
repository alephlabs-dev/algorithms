import { describe, expect, it } from "vitest";
import { shapeOptions } from "@/consts/fourierSeries";
import { circleOptions, decodePath, dft, encodePath, FourierRun, shapePoints, strokeWalk, waveAt, waveTerms } from ".";

describe("fourier", () => {
  it("rebuilds each wave better with more circles, and nearly exactly with many", () => {
    for (const wave of ["square", "sawtooth", "triangle"] as const) {
      const errors = circleOptions.wave.map((n) => new FourierRun(wave, n, "heart", null).error);
      for (let k = 1; k < errors.length; k++) expect(errors[k]).toBeLessThan(errors[k - 1]);
      // Jumps (square, sawtooth) converge slowly: the Gibbs overshoot never goes away. Smooth waves converge fast.
      expect(errors[errors.length - 1]).toBeLessThan(wave === "triangle" ? 0.005 : 0.12);
    }
  });

  it("matches the textbook sums at a few points", () => {
    const sum = (wave: "square" | "triangle", theta: number) =>
      waveTerms(wave, 2000).reduce((s, t) => s + t.amp * Math.sin(t.freq * theta + t.phase), 0);
    expect(sum("square", Math.PI / 2)).toBeCloseTo(waveAt("square", Math.PI / 2), 2);
    expect(sum("triangle", Math.PI / 4)).toBeCloseTo(waveAt("triangle", Math.PI / 4), 3);
  });

  it("gives a drawing back exactly from all its circles, and roughly from a few", () => {
    for (const shape of ["heart", "star", "infinity", "square"] as const) {
      expect(new FourierRun("epicycles", 25, shape, null).error).toBeLessThan(0.05);
      expect(new FourierRun("epicycles", 3, shape, null).error).toBeGreaterThan(
        new FourierRun("epicycles", 25, shape, null).error,
      );
    }
  });

  it("traces every ready-made drawing, exactly with all its circles", () => {
    for (const { value } of shapeOptions.filter((o) => o.value !== "custom")) {
      const all = new FourierRun("epicycles", 256, value, null);
      expect(all.error).toBeLessThan(1e-9);
      expect(all.target.every((p) => Math.hypot(p.x, p.y) <= 1 + 1e-9)).toBe(true);
      expect(new FourierRun("epicycles", 100, value, null).error).toBeLessThan(0.03);
    }
    // Constellations keep their stars, moved with the drawing: in Orion every star is on a line, so on the path.
    expect(new FourierRun("epicycles", 50, "crux", null).stars).toHaveLength(5);
    const orion = new FourierRun("epicycles", 50, "orion", null);
    for (const star of orion.stars) {
      const nearest = Math.min(...orion.target.map((p) => Math.hypot(p.x - star.x, p.y - star.y)));
      expect(nearest).toBeLessThan(0.03);
    }
  });

  it("walks a line drawing there and back, ending where it began", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
    ];
    const walk = strokeWalk(points, [
      [0, 1],
      [1, 2],
      [1, 3],
    ]);
    expect(walk[0]).toEqual(walk[walk.length - 1]);
    // Each stroke twice, so 2 × 3 steps.
    expect(walk).toHaveLength(7);
    // A stroke the start can't reach is an error, not a silently missing piece.
    expect(() =>
      strokeWalk(points, [
        [0, 1],
        [2, 3],
      ]),
    ).toThrow();
  });

  it("sorts circles biggest first, and the drawing ends where it started", () => {
    const terms = dft(shapePoints("heart", null));
    for (let k = 1; k < terms.length; k++) expect(terms[k].amp).toBeLessThanOrEqual(terms[k - 1].amp);
    const run = new FourierRun("epicycles", 50, "star", null);
    expect(run.tips[0].x).toBeCloseTo(run.tips[run.length - 1].x, 9);
    expect(run.tips[0].y).toBeCloseTo(run.tips[run.length - 1].y, 9);
  });

  it("packs a hand-drawn path into a link and back", () => {
    const path = Array.from({ length: 30 }, (_, k) => ({ x: Math.cos(k / 5), y: Math.sin(k / 3) }));
    const back = decodePath(encodePath(path))!;
    expect(back).toHaveLength(64);
    expect(decodePath("nope")).toBeNull();
    expect(new FourierRun("epicycles", 25, "custom", back).error).toBeLessThan(0.1);
  });
});
