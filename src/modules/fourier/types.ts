/**
 * Fourier series: a shape or a wave rebuilt from circles, each turning at its
 * own whole-number speed on the tip of the one before. Unlike the other
 * modules there are no discrete steps: playback moves through one turn of the
 * slowest circle, a degree per frame.
 */

/** Three classic waves made of sines, and a closed drawing made of rotating vectors. */
export type FourierAlgorithm = "square" | "sawtooth" | "triangle" | "epicycles";

/** One circle: it turns `freq` times per turn, with radius `amp`, starting at angle `phase`. */
export type Term = { freq: number; amp: number; phase: number };

/** A point in the plane; for drawings, a share of the drawing's size around its middle (−1 to 1). */
export type Point = { x: number; y: number };

/** Every drawing, in the picker's order; "custom" is the learner's own. */
export const FOURIER_SHAPES = [
  ...(["heart", "star", "infinity", "square", "crux", "orion", "dipper", "cassiopeia"] as const),
  ...(["aleph", "butterfly", "fish", "cat", "note", "bolt", "custom"] as const),
] as const;
export type FourierShape = (typeof FOURIER_SHAPES)[number];
