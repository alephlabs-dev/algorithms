// Internally speed is a position from 0 to 1 on an exponential scale: 1 step
// per second at 0, ~8000 at 1. That range covers 10 items and 400 alike, even at
// 8×. People pick a preset relative to a pace chosen for the current run (see speedFor).
const DOUBLINGS = 13;

/** About 4.6 steps per second: the pace for small arrays at 1×. */
export const DEFAULT_SPEED = 2.2 / DOUBLINGS;

export const stepsPerSecond = (speed: number) => 2 ** (speed * DOUBLINGS);

/** Milliseconds between steps. */
export const stepDelay = (speed: number) => 1000 / stepsPerSecond(speed);

/** Seconds a bar takes to move. Fast speeds snap so the bars don't lag behind. */
export const moveDuration = (speed: number) => {
  const seconds = (stepDelay(speed) / 1000) * 0.85;
  return seconds < 0.02 ? 0 : Math.min(seconds, 0.5);
};

export const formatStepsPerSecond = (speed: number) => {
  const sps = stepsPerSecond(speed);
  return sps < 10 ? sps.toFixed(1) : String(Math.round(sps));
};

/** Inverse of `stepsPerSecond`, clamped to the slider's range. */
export const speedForStepsPerSecond = (sps: number) =>
  Math.min(1, Math.max(0, Math.log2(sps) / DOUBLINGS));

/**
 * A speed that finishes `steps` steps within `seconds` (each module's slice says how long its
 * runs should take at most: searches read best brisk, sorts can take minutes at 1×),
 * never slower than the default. Small runs stay at the default speed; only long runs get faster.
 */
export const autoSpeed = (steps: number, seconds: number) =>
  Math.max(DEFAULT_SPEED, speedForStepsPerSecond(steps / seconds));

// Each preset doubles the one before it, so every jump feels the same.
export const speedPresets = ["0.5x", "1x", "2x", "4x", "8x"] as const;
export type SpeedPreset = (typeof speedPresets)[number];
export const DEFAULT_PRESET: SpeedPreset = "1x";

const multipliers: Record<SpeedPreset, number> = { "0.5x": 0.5, "1x": 1, "2x": 2, "4x": 4, "8x": 8 };

/**
 * Presets links used to carry, and the nearest kept one. "max" is from before
 * the presets were all multiples. A Map, so names like "constructor" from a
 * link never match an inherited key.
 */
export const droppedPresets: ReadonlyMap<string, SpeedPreset> = new Map([
  ["0.25x", "0.5x"],
  ["16x", "8x"],
  ["max", "8x"],
]);

export const presetLabels = Object.fromEntries(
  speedPresets.map((p) => [p, `${multipliers[p]}×`])
) as Record<SpeedPreset, string>;

/**
 * The speed for a preset on a run of `steps` steps: 1× is a comfortable pace for
 * that run (see autoSpeed) and the others are multiples of it.
 */
export const speedFor = (preset: SpeedPreset, steps: number, seconds: number) =>
  Math.min(1, Math.max(0, autoSpeed(steps, seconds) + Math.log2(multipliers[preset]) / DOUBLINGS));
