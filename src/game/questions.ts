import type { Timeline } from "@/algorithms/timeline";
import { KnapsackRun, type TableRun } from "@/dp";
import type { HashFrame, StructureRun, TreeFrame } from "@/structures";
import type { Algorithm } from "@/types";
import { narrateDp } from "@/utils/narrateDp";

/** An empty spot in a tree where a new value could go: under `parent`, on `side`. */
export type Slot = {
  key: string;
  parent: number;
  side: "left" | "right";
  /** "left of 30": for the buttons that stand in for tapping. */
  label: string;
};

type Base = {
  /** Asked just before playback shows this frame, which would give the answer away. */
  at: number;
  /** The run it's about; a question for a run that's been replaced is stale. */
  run: object;
  prompt: string;
  /** What to say once it's answered, right or wrong. */
  explain: (right: boolean) => string;
};

export type Question =
  /** Tap the spot in the tree where the value will land. */
  | (Base & { kind: "slot"; value: number; slots: Slot[]; answer: string })
  /** Pick one of a few numbers (a cell's value, a bucket, a count of swaps). */
  | (Base & { kind: "choice"; options: number[]; answer: number; cell?: { i: number; j: number } })
  | (Base & { kind: "yesno"; answer: boolean });

export type Answer = string | number | boolean;

const slotKey = (parent: number, side: "left" | "right") => `${parent}${side[0]}`;

/** Every empty child spot in a tree, left to right as they appear on screen. */
const emptySlots = (frame: TreeFrame): Slot[] =>
  [...frame.nodes]
    .sort((a, b) => a.value - b.value)
    .flatMap((n) =>
      (["left", "right"] as const)
        .filter((side) => n[side] === null)
        .map((side) => ({ key: slotKey(n.id, side), parent: n.id, side, label: `${side} of ${n.value}` })),
    );

/** Up to four numbers around `answer`, from `near` first, all different, in order. */
const choicesAround = (answer: number, near: number[], min = 0, max = Infinity) => {
  const picks = new Set<number>([answer]);
  for (const v of [...near, answer + 1, answer - 1, answer + 2, answer - 2, answer + 3])
    if (picks.size < 4 && v >= min && v <= max) picks.add(v);
  return [...picks].sort((a, b) => a - b);
};

const valueIn = (frame: TreeFrame, id: number) => frame.nodes.find((n) => n.id === id)?.value;

/** Data structures: where an insert lands (trees), whether AVL rotates, how far a heap value climbs, which bucket. */
export const structureQuestions = (run: StructureRun): Question[] => {
  const questions: Question[] = [];
  const { frames, opStarts, algorithm } = run;
  opStarts.forEach((start, k) => {
    const end = k + 1 < opStarts.length ? opStarts[k + 1] : frames.length;
    const op =
      frames[start].event.type === "start" ? (frames[start].event as { op: { kind: string; value: number } }).op : null;
    if (!op) return;
    const opFrames = frames.slice(start, end);

    if (algorithm === "bst" || algorithm === "avl") {
      const before = frames[start] as TreeFrame;
      const placeAt = opFrames.findIndex((f) => f.event.type === "place");
      if (op.kind === "insert" && placeAt > 0 && before.root !== null) {
        const place = opFrames[placeAt].event as { parent: number; side: "left" | "right" };
        const path = opFrames
          .slice(1, placeAt)
          .flatMap((f) => (f.event.type === "compare" ? [f.event] : []))
          .map((e) => `${e.value} ${e.go === "left" ? "<" : ">"} ${valueIn(before, e.node)}`)
          .join(", ");
        const parent = valueIn(before, place.parent);
        questions.push({
          kind: "slot",
          at: start + 1,
          run,
          value: op.value,
          prompt: `Where will ${op.value} land? Tap a spot.`,
          slots: emptySlots(before),
          answer: slotKey(place.parent, place.side),
          explain: (right) => `${right ? "Right" : `It goes ${place.side} of ${parent}`}: ${path}.`,
        });
      }
      // AVL: once the value is in (or out), will it have to rotate?
      const changed = opFrames.findIndex((f) => f.event.type === "place" || f.event.type === "removed");
      if (algorithm === "avl" && changed > 0 && (opFrames[changed] as TreeFrame).nodes.length >= 3) {
        const rotations = opFrames.filter((f) => f.event.type === "rotate").length;
        questions.push({
          kind: "yesno",
          at: start + changed + 1,
          run,
          answer: rotations > 0,
          prompt: `${op.kind === "insert" ? `${op.value} is in` : `${op.value} is out`}. Will the tree have to rotate?`,
          explain: (right) =>
            `${right ? "Right" : rotations ? "It does" : "It doesn't"}: ${
              rotations
                ? `one side got two taller, so ${rotations === 1 ? "a rotation fixes it" : `${rotations} rotations fix it`}.`
                : "every balance stays between −1 and +1."
            }`,
        });
      }
    }

    if (algorithm === "heap" && op.kind === "insert") {
      const appended = opFrames.findIndex((f) => f.event.type === "append");
      const before = opFrames[appended] as TreeFrame | undefined;
      if (appended > 0 && before && before.nodes.length >= 3) {
        const swaps = opFrames.filter((f) => f.event.type === "swap").length;
        const levels = Math.floor(Math.log2(before.nodes.length));
        questions.push({
          kind: "choice",
          at: start + appended + 1,
          run,
          prompt: `${op.value} is at the bottom. How many swaps up will it take?`,
          options: choicesAround(swaps, [0, 1, 2, levels], 0, levels),
          answer: swaps,
          explain: (right) =>
            `${right ? "Right" : `It takes ${swaps}`}: ${
              swaps ? `it climbs while it's smaller than its parent.` : `it's no smaller than its parent, so it stays.`
            }`,
        });
      }
    }

    if ((algorithm === "chaining" || algorithm === "probing") && op.kind === "insert") {
      const placed = opFrames.find((f) => f.event.type === "place") as HashFrame | undefined;
      if (placed && placed.event.type === "place") {
        const size = placed.buckets.length;
        const home = op.value % size;
        const lands = placed.event.bucket;
        const probing = algorithm === "probing";
        questions.push({
          kind: "choice",
          at: start + 1,
          run,
          prompt: probing
            ? `Which slot will ${op.value} end up in? (${size} slots)`
            : `Which bucket does ${op.value} go in? (${size} buckets)`,
          options: choicesAround(lands, [home, (home + 1) % size, (home + 2) % size, (lands + 1) % size], 0, size - 1),
          answer: lands,
          explain: (right) =>
            `${right ? "Right" : `It's ${lands}`}: ${op.value} mod ${size} = ${home}${
              probing && lands !== home ? `, taken, so it walks on to ${lands}` : ""
            }.`,
        });
      }
    }
  });
  return questions;
};

/**
 * Dynamic programming: a cell's value, before it's filled. Every third cell
 * (and the corner, the answer), so the run is a game and not an exam.
 */
export const dpQuestions = (run: TableRun): Question[] => {
  const questions: Question[] = [];
  let count = 0;
  const cells = run.frames.filter((f) => f.event.type === "cell").length;
  run.frames.forEach((frame, at) => {
    const e = frame.event;
    if (e.type !== "cell") return;
    count++;
    const corner = count === cells;
    if (count % 3 !== 2 && !corner) return;
    const near = e.options.map((o) => o.value);
    const knapsack = run instanceof KnapsackRun;
    questions.push({
      kind: "choice",
      at,
      run,
      cell: { i: e.i, j: e.j },
      prompt: corner
        ? "The corner: what's the answer?"
        : knapsack
          ? `Best value with room ${e.j}?`
          : "What goes in this cell?",
      options: choicesAround(e.value, near, 0),
      answer: e.value,
      explain: (right) => `${right ? "Right" : `It's ${e.value}`}. ${narrateDp(run, at)}`,
    });
  });
  return questions;
};

/** Insertion sort: how many places each picked-up value moves left. */
const insertionQuestions = (run: Timeline): Question[] => {
  // Each pass opens with a highlight of the sorted part plus the value it picks up.
  const starts: number[] = [];
  for (let at = 1; at < run.length; at++) if (run.stepAt(at)?.type === "highlight") starts.push(at);
  return starts.map((at, k) => {
    const step = run.stepAt(at);
    const picked = (step?.type === "highlight" ? (step.temp?.length ?? 1) : 1) - 1;
    const end = k + 1 < starts.length ? starts[k + 1] : run.length - 1;
    let moves = 0;
    for (let f = at + 1; f <= end; f++) if (run.stepAt(f)?.type === "swap") moves++;
    const value = run.valuesAt(at)[picked];
    return {
      kind: "choice",
      at,
      run,
      prompt: `${value} joins the sorted part. How many places does it move left?`,
      options: choicesAround(moves, [], 0, picked),
      answer: moves,
      explain: (right) =>
        `${right ? "Right" : `It's ${moves}`}: ${
          moves === 0
            ? `${value} is already at least as big as the value before it.`
            : `${value} slides past ${moves} bigger value${moves === 1 ? "" : "s"}.`
        }`,
    };
  });
};

/** Sorting: each algorithm asks about its key moment. Algorithms without one yet ask nothing. */
export const sortQuestions = (run: Timeline, algorithm: Algorithm): Question[] =>
  algorithm === "insertion" ? insertionQuestions(run) : [];
