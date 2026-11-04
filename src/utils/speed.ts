import type { StepKind } from "@/algorithms";

// Internally speed is a position from 0 to 1 on an exponential scale: 1 step
// per second at 0, ~2000 at 1. That range covers 10 items and 400 alike. People
// pick a preset relative to a pace chosen for the current run (see speedFor).
const DOUBLINGS = 11;

export const DEFAULT_SPEED = 0.2;

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

// How long a run should take at most when the speed is picked automatically.
// Small arrays stay at the default speed; only long runs get faster.
const TARGET_SECONDS = { single: 240, race: 30 } as const;

/**
 * A speed that finishes `steps` steps within the target time for the view,
 * never slower than the default.
 */
export const autoSpeed = (steps: number, view: keyof typeof TARGET_SECONDS) =>
  Math.max(DEFAULT_SPEED, speedForStepsPerSecond(steps / TARGET_SECONDS[view]));

export const speedPresets = ["0.5x", "1x", "2x", "4x", "max"] as const;
export type SpeedPreset = (typeof speedPresets)[number];
export const DEFAULT_PRESET: SpeedPreset = "1x";

export const presetLabels: Record<SpeedPreset, string> = {
  "0.5x": "0.5×",
  "1x": "1×",
  "2x": "2×",
  "4x": "4×",
  max: "Max",
};

const multipliers: Record<Exclude<SpeedPreset, "max">, number> = { "0.5x": 0.5, "1x": 1, "2x": 2, "4x": 4 };

/**
 * The speed for a preset on a run of `steps` steps: 1× is a comfortable pace for
 * that run (see autoSpeed), the others are multiples of it, and Max is the top speed.
 */
export const speedFor = (preset: SpeedPreset, steps: number, view: keyof typeof TARGET_SECONDS) =>
  preset === "max"
    ? 1
    : Math.min(1, autoSpeed(steps, view) + Math.log2(multipliers[preset]) / DOUBLINGS);

/**
 * Share of a full step each kind of step takes during playback. Moves get the
 * full beat, comparisons a shorter one, and steps that only move the
 * pseudocode line pass instantly, so the rhythm reads "look, move" instead of
 * an even tick with pauses where nothing happens.
 */
export const STEP_WEIGHT: Record<StepKind, number> = {
  swap: 1,
  move: 1,
  finish: 1,
  compare: 0.6,
  highlight: 0.5,
  done: 0.4,
  line: 0,
};
