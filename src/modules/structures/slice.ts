import { questionsOf } from "@/game";
import { structureQuestions } from "./questions";
import { decodeOperations, encodeOperations, MAX_OPERATIONS } from "./operations";
import { presetOperations, type StructurePreset, type StructureSize } from "./presets";
import { recordStructure } from "./record";
import { TreeRecorder } from "./tree";
import type { HashEvent, Operation, StructureAlgorithm, StructureRun, TreeAlgorithm, TreeEvent } from "./types";
import type { View } from "@/appStore";
import { structuresLink, type StructuresLink } from "./link";
import { newSeed, seededRandom } from "@/utils/random";
import { defineModule, type SliceContext } from "@/modules/slice";
import { sentences } from "./sentences";

export type StructuresState = {
  algorithm: StructureAlgorithm;
  /** What "new values" makes, and how many. */
  preset: StructurePreset;
  size: StructureSize;
  /** Every operation so far, replayed into the structure. */
  ops: Operation[];
  /** The whole run of the operations, precomputed. */
  run: StructureRun;
  /** One run per racer: the same operations, with and without balancing. Empty outside race view. */
  raceRuns: TreeRecorder[];
  /** Changes when the operations are replaced, so the stage starts fresh. */
  inputId: number;
};

// The race is the point of AVL: the same operations, with and without balancing.
const RACERS: TreeAlgorithm[] = ["bst", "avl"];

const raceRunsFor = (view: View, ops: Operation[]) =>
  view === "race" ? RACERS.map((a) => new TreeRecorder(a, ops)) : [];

/** The runs after the operations change: the single one and, in a race, both racers. */
const runsFor = (s: StructuresState, ctx: SliceContext, ops: Operation[]) => ({
  ops,
  run: recordStructure(s.algorithm, ops),
  raceRuns: raceRunsFor(ctx.view, ops),
});

const fresh = (s: StructuresState, ctx: SliceContext, preset: StructurePreset, size: StructureSize) => ({
  preset,
  size,
  ...runsFor(s, ctx, presetOperations(preset, size, seededRandom(newSeed()))),
  inputId: s.inputId + 1,
});

/** A rotation gets the longest beat, so the nodes can be seen gliding; going back up is quick. */
const STEP_WEIGHT: Record<TreeEvent["type"] | HashEvent["type"], number> = {
  start: 0.7,
  compare: 0.8,
  place: 1,
  duplicate: 1,
  found: 1,
  missing: 1,
  remove: 1,
  removed: 1,
  successor: 1,
  height: 0.5,
  rotate: 1.6,
  // Heap: a swap glides like a rotation; scanning slot after slot is quick.
  append: 1,
  sift: 0.7,
  swap: 1.3,
  scan: 0.5,
  take: 1,
  lift: 1.3,
  // Hash tables: the jump to a bucket is the point, so it gets a beat.
  hash: 1,
  probe: 0.7,
  full: 1,
  done: 0.4,
};

export const structuresSlice = defineModule<StructuresState, StructureAlgorithm, StructuresLink>()({
  sentences,
  tourKey: "tour-done-structures",

  link: structuresLink,
  hydrate: (link, ctx) => {
    const algorithm = link.algorithm ?? "avl";
    const preset = link.params.preset ?? "example";
    const size = link.params.size ?? (ctx.isMobile ? "small" : "medium");
    const ops =
      (link.params.ops && decodeOperations(link.params.ops)) ||
      presetOperations(preset, size, seededRandom(newSeed()));
    return {
      algorithm,
      preset,
      size,
      ops,
      run: recordStructure(algorithm, ops),
      raceRuns: raceRunsFor(ctx.view, ops),
      inputId: 0,
    };
  },

  current: (s) => s.algorithm,

  pick: (s, _, algorithm) => ({ algorithm, run: recordStructure(algorithm, s.ops) }),

  actions: {
    applyPreset: (s, ctx, preset: StructurePreset) => fresh(s, ctx, preset, s.size),
    setSize: (s, ctx, size: StructureSize) => fresh(s, ctx, s.preset, size),
    runOperation: (s, ctx, op: Operation) => runsFor(s, ctx, [...s.ops, op].slice(-MAX_OPERATIONS)),
  },

  playFrom: {
    // Play just the new operation; a race replays everything, so both trees start even.
    runOperation: (s, ctx) => (ctx.view === "race" ? 0 : s.run.opStarts[s.run.opStarts.length - 1]),
  },

  forView: (s, ctx) => ({ raceRuns: raceRunsFor(ctx.view, s.ops) }),

  newInput: (s, ctx) => fresh(s, ctx, s.preset, s.size),

  engine: {
    // Races tick one frame per lane, so the clock runs until the longer run is done.
    lastIndex: (s, view) =>
      view === "race" ? Math.max(0, ...s.raceRuns.map((r) => r.frames.length - 1)) : s.run.frames.length - 1,
    stepWeight: (s, index) => STEP_WEIGHT[s.run.frames[index]?.event.type ?? "done"],
    pace: (view) => (view === "race" ? 25 : 30),
    search: (s, ctx) =>
      structuresLink.write(
        {
          ops: encodeOperations(s.ops),
          size: s.size,
          preset: s.preset,
        },
        ctx.speedPreset,
      ),
    game: (s) => questionsOf(s.run, structureQuestions),
  },
});
