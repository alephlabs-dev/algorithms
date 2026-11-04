import { describe, expect, it } from "vitest";
import { circleOptions, decodePath, dft, encodePath, FourierRun, shapePoints, waveAt, waveTerms } from ".";

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
      expect(new FourierRun("epicycles", 256, shape, null).error).toBeLessThan(1e-9);
      expect(new FourierRun("epicycles", 25, shape, null).error).toBeLessThan(0.05);
      expect(new FourierRun("epicycles", 3, shape, null).error).toBeGreaterThan(
        new FourierRun("epicycles", 25, shape, null).error,
      );
    }
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
