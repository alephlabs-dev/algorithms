import {
  circleOptions,
  decodePath,
  defaultCircles,
  encodePath,
  FourierRun,
  isWave,
  linkShape,
  type FourierAlgorithm,
  type FourierShape,
  type Point,
} from "@/fourier";
import { toFourierSearch } from "@/urlState";
import { defineModule } from "./slice";

export type FourierState = {
  algorithm: FourierAlgorithm;
  /** How many circles the series adds up. */
  circles: number;
  shape: FourierShape;
  /** The hand-drawn shape, when `shape` is "custom"; null until it's drawn. */
  path: Point[] | null;
  /** The whole run, precomputed. */
  run: FourierRun;
};

/** A circle count that fits the series: one of its options, the default if the asked-for one isn't. */
const fitCircles = (algorithm: FourierAlgorithm, circles: number | undefined) => {
  const kind = isWave(algorithm) ? "wave" : "drawing";
  return circles !== undefined && circleOptions[kind].includes(circles) ? circles : defaultCircles[kind];
};

const runOf = (s: Pick<FourierState, "algorithm" | "circles" | "shape" | "path">) =>
  new FourierRun(s.algorithm, s.circles, s.shape, s.path);

export const fourierSlice = defineModule<FourierState, FourierAlgorithm>()({
  tourKey: "tour-done-fourier",

  hydrate: (link) => {
    const algorithm = link.fourierAlgorithm ?? "square";
    const settings = {
      algorithm,
      circles: fitCircles(algorithm, link.fourier.circles),
      shape: link.fourier.shape ?? "heart",
      path: link.fourier.path ? decodePath(link.fourier.path) : null,
    };
    return { ...settings, run: runOf(settings) };
  },

  current: (s) => s.algorithm,

  pick: (s, _, algorithm) => {
    const circles = fitCircles(algorithm, s.circles);
    return { algorithm, circles, run: runOf({ ...s, algorithm, circles }) };
  },

  actions: {
    setCircles: (s, _, circles: number) => ({ circles, run: runOf({ ...s, circles }) }),
    setShape: (s, _, shape: FourierShape) => {
      const path = shape === "custom" ? null : s.path;
      return { shape, path, run: runOf({ ...s, shape, path }) };
    },
    /** A hand-drawn shape, fitted for its link right away so what's drawn is what's shared. */
    setPath: (s, _, stroke: Point[]) => {
      const path = linkShape(stroke);
      return { shape: "custom", path, run: runOf({ ...s, shape: "custom", path }) };
    },
  },

  // "New" adds circles, wrapping back to the fewest: the quickest way to see the series converge.
  newInput: (s) => {
    const options = circleOptions[isWave(s.algorithm) ? "wave" : "drawing"];
    const circles = options[(options.indexOf(s.circles) + 1) % options.length];
    return { circles, run: runOf({ ...s, circles }) };
  },

  engine: {
    // A frame per degree; every frame gets the same beat, so circles turn at an even pace.
    lastIndex: (s) => s.run.length - 1,
    stepWeight: () => 1,
    pace: () => "fourier",
    search: (s, ctx) =>
      toFourierSearch({
        circles: s.circles,
        // Only drawings have a shape; a hand-drawn one travels in the link.
        ...(s.algorithm === "epicycles" && { shape: s.shape }),
        ...(s.algorithm === "epicycles" && s.shape === "custom" && s.path && { path: encodePath(s.path) }),
        speed: ctx.speedPreset,
      }),
  },
});
