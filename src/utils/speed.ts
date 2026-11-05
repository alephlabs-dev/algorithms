import type { StepKind } from "@/algorithms";
import type { GraphStep } from "@/graphs/types";
import type { PathStepKind } from "@/pathfinding";

// Internally speed is a position from 0 to 1 on an exponential scale: 1 step
// per second at 0, ~8000 at 1. That range covers 10 items and 400 alike, even at
// 16×. People pick a preset relative to a pace chosen for the current run (see speedFor).
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

// How long a run should take at most when the speed is picked automatically.
// Small arrays stay at the default speed; only long runs get faster.
// Searches are shorter and read best brisk; sorts can take minutes at 1×.
const TARGET_SECONDS = { single: 240, race: 30, pathfinding: 20, pathRace: 20, graphs: 25, graphRace: 25, fourier: 12, structures: 30, structureRace: 25 } as const;

/** Which of the paces above a run uses. */
export type Pace = keyof typeof TARGET_SECONDS;

/**
 * A speed that finishes `steps` steps within the target time for the view,
 * never slower than the default.
 */
export const autoSpeed = (steps: number, view: Pace) =>
  Math.max(DEFAULT_SPEED, speedForStepsPerSecond(steps / TARGET_SECONDS[view]));

// Each preset doubles the one before it, so every jump feels the same.
export const speedPresets = ["0.25x", "0.5x", "1x", "2x", "4x", "8x", "16x"] as const;
export type SpeedPreset = (typeof speedPresets)[number];
export const DEFAULT_PRESET: SpeedPreset = "1x";

const multipliers: Record<SpeedPreset, number> = { "0.25x": 0.25, "0.5x": 0.5, "1x": 1, "2x": 2, "4x": 4, "8x": 8, "16x": 16 };

export const presetLabels = Object.fromEntries(
  speedPresets.map((p) => [p, `${multipliers[p]}×`])
) as Record<SpeedPreset, string>;

/**
 * The speed for a preset on a run of `steps` steps: 1× is a comfortable pace for
 * that run (see autoSpeed) and the others are multiples of it.
 */
export const speedFor = (preset: SpeedPreset, steps: number, view: Pace) =>
  Math.min(1, Math.max(0, autoSpeed(steps, view) + Math.log2(multipliers[preset]) / DOUBLINGS));

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

/**
 * The same idea for searches: each visit gets a beat, frontier updates follow
 * quickly, and the final path traces fast so it reads as one stroke.
 */
/**
 * Graphs: visiting a node gets the full beat, looking along an edge and
 * adding a node to the queue a shorter one.
 */
export const GRAPH_STEP_WEIGHT: Record<GraphStep["type"], number> = {
  pop: 1,
  edge: 0.6,
  push: 0.6,
  back: 0.6,
  // Kruskal: looking at the next edge, then keeping or skipping it.
  sort: 1,
  consider: 0.6,
  join: 1,
  reject: 1,
  lower: 0.4,
  done: 1,
};

export const PATH_STEP_WEIGHT: Record<PathStepKind, number> = {
  visit: 1,
  frontier: 0.4,
  path: 0.3,
  done: 1,
};
