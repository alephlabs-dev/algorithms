import type { Timeline } from "@/algorithms/timeline";
import { KnapsackRun, type TableRun } from "@/dp";
import type { HashFrame, StructureRun, TreeFrame } from "@/structures";
import { localized } from "@/i18n";
import type { Algorithm } from "@/types";
import { narrateDp } from "@/utils/narrateDp";
import { choicesAround, verdict } from "./choices";
import { heapQuestions, mergeQuestions } from "./sortMergeHeap";
import { quickQuestions, shellQuestions } from "./sortPartitions";
import { bubbleQuestions, cocktailQuestions, selectionQuestions } from "./sortPasses";
import { radixQuestions } from "./sortRadix";

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
  /** Items the stage labels with their values while it asks, so the prompt's numbers can be found. */
  labels?: number[];
};

export type Question =
  /** Tap the spot in the tree where the value will land. */
  | (Base & { kind: "slot"; value: number; slots: Slot[]; answer: string })
  /** Pick one of a few numbers (a cell's value, a bucket, a count of swaps). */
  | (Base & {
      kind: "choice";
      options: number[];
      answer: number;
      cell?: { i: number; j: number };
      /** N-Queens: the row the queen is about to land in, and the first column it tries (both from 0). */
      queenRow?: { row: number; from: number };
      /** Pathfinding: the options are grid cells, marked on the grid with their labels (A–D). */
      gridCells?: boolean;
      /** Where each marked cell is, for screen readers: "A: row 2, column 5; …". */
      marksText?: string;
      /** What each option's button says, when the bare number can't (heap sort's "4 stays"). */
      optionLabels?: string[];
    })
  | (Base & { kind: "yesno"; answer: boolean });

export type Answer = string | number | boolean;

/** A question whose options are grid cells marked with letters (pathfinding). */
export type CellQuestion = Extract<Question, { kind: "choice" }> & { gridCells: true };

export const isCellQuestion = (q: Question | null | undefined): q is CellQuestion =>
  q?.kind === "choice" && q.gridCells === true;

type Side = "left" | "right";

const text = localized({
  en: {
    slot: (side: Side, value: number) => `${side} of ${value}`,
    whereLands: (value: number) => `Where will ${value} land? Tap a spot.`,
    goesTo: (side: Side, parent: number | undefined) => `It goes ${side} of ${parent}`,
    inOrOut: (insert: boolean, value: number) => `${insert ? `${value} is in` : `${value} is out`}. Will the tree have to rotate?`,
    rotates: (rotations: number): string => (rotations ? "It does" : "It doesn't"),
    rotateWhy: (rotations: number) =>
      rotations
        ? `one side got two taller, so ${rotations === 1 ? "a rotation fixes it" : `${rotations} rotations fix it`}.`
        : "every balance stays between −1 and +1.",
    climb: (value: number) => `${value} is at the bottom. How many swaps up will it take?`,
    takes: (swaps: number) => `It takes ${swaps}`,
    climbWhy: (swaps: number): string =>
      swaps ? `it climbs while it's smaller than its parent.` : `it's no smaller than its parent, so it stays.`,
    slotOf: (value: number, size: number) => `Which slot will ${value} end up in? (${size} slots)`,
    bucketOf: (value: number, size: number) => `Which bucket does ${value} go in? (${size} buckets)`,
    walksOn: (lands: number) => `, taken, so it walks on to ${lands}`,
    corner: "The corner: what's the answer?",
    bestValue: (room: number) => `Best value with room ${room}?`,
    cell: "What goes in this cell?",
    slides: (value: number) => `${value} joins the sorted part. How many places does it move left?`,
    slidesWhy: (value: number, moves: number) =>
      moves === 0
        ? `${value} is already at least as big as the value before it.`
        : `${value} slides past ${moves} bigger value${moves === 1 ? "" : "s"}.`,
  },
  es: {
    slot: (side, value) => `${side === "left" ? "izquierda" : "derecha"} de ${value}`,
    whereLands: (value) => `¿Dónde caerá ${value}? Toca un lugar.`,
    goesTo: (side, parent) => `Va a la ${side === "left" ? "izquierda" : "derecha"} de ${parent}`,
    inOrOut: (insert, value) => `${value} ya ${insert ? "entró" : "salió"}. ¿Tendrá que rotar el árbol?`,
    rotates: (rotations) => (rotations ? "Sí rota" : "No rota"),
    rotateWhy: (rotations) =>
      rotations
        ? `un lado quedó dos niveles más alto, así que ${rotations === 1 ? "una rotación lo arregla" : `${rotations} rotaciones lo arreglan`}.`
        : "todos los balances quedan entre −1 y +1.",
    climb: (value) => `${value} está al fondo. ¿Cuántos intercambios hará para subir?`,
    takes: (swaps) => `Hace ${swaps}`,
    climbWhy: (swaps) =>
      swaps ? "sube mientras sea menor que su padre." : "no es menor que su padre, así que se queda.",
    slotOf: (value, size) => `¿En qué casilla terminará ${value}? (${size} casillas)`,
    bucketOf: (value, size) => `¿En qué cubeta va ${value}? (${size} cubetas)`,
    walksOn: (lands) => `, ocupada, así que sigue hasta ${lands}`,
    corner: "La esquina: ¿cuál es la respuesta?",
    bestValue: (room) => `¿Mejor valor con capacidad ${room}?`,
    cell: "¿Qué va en esta celda?",
    slides: (value) => `${value} entra en la parte ordenada. ¿Cuántos lugares se mueve a la izquierda?`,
    slidesWhy: (value, moves) =>
      moves === 0
        ? `${value} ya es al menos tan grande como el valor anterior.`
        : `${value} se desliza más allá de ${moves === 1 ? "1 valor mayor" : `${moves} valores mayores`}.`,
  },
});

const slotKey = (parent: number, side: "left" | "right") => `${parent}${side[0]}`;

/** Every empty child spot in a tree, left to right as they appear on screen. */
const emptySlots = (frame: TreeFrame): Slot[] =>
  [...frame.nodes]
    .sort((a, b) => a.value - b.value)
    .flatMap((n) =>
      (["left", "right"] as const)
        .filter((side) => n[side] === null)
        .map((side) => ({ key: slotKey(n.id, side), parent: n.id, side, label: text.slot(side, n.value) })),
    );

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
          prompt: text.whereLands(op.value),
          slots: emptySlots(before),
          answer: slotKey(place.parent, place.side),
          explain: (right) => `${right ? verdict.right : text.goesTo(place.side, parent)}: ${path}.`,
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
          prompt: text.inOrOut(op.kind === "insert", op.value),
          explain: (right) => `${right ? verdict.right : text.rotates(rotations)}: ${text.rotateWhy(rotations)}`,
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
          prompt: text.climb(op.value),
          options: choicesAround(swaps, [0, 1, 2, levels], 0, levels),
          answer: swaps,
          explain: (right) => `${right ? verdict.right : text.takes(swaps)}: ${text.climbWhy(swaps)}`,
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
          prompt: probing ? text.slotOf(op.value, size) : text.bucketOf(op.value, size),
          options: choicesAround(lands, [home, (home + 1) % size, (home + 2) % size, (lands + 1) % size], 0, size - 1),
          answer: lands,
          explain: (right) =>
            `${right ? verdict.right : verdict.its(lands)}: ${op.value} mod ${size} = ${home}${
              probing && lands !== home ? text.walksOn(lands) : ""
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
      prompt: corner ? text.corner : knapsack ? text.bestValue(e.j) : text.cell,
      options: choicesAround(e.value, near, 0),
      answer: e.value,
      explain: (right) => `${right ? verdict.right : verdict.its(e.value)}. ${narrateDp(run, at)}`,
    });
  });
  return questions;
};

/** Insertion sort: how many places each picked-up value moves left. */
const insertionQuestions = (run: Timeline): Question[] => {
  // Each pass opens with a highlight of the sorted part plus the value it picks up.
  const passes: number[] = [];
  for (let f = 1; f < run.length; f++) if (run.stepAt(f)?.type === "highlight") passes.push(f);
  return passes.map((lit, k) => {
    const step = run.stepAt(lit);
    const picked = (step?.type === "highlight" ? (step.temp?.length ?? 1) : 1) - 1;
    const end = k + 1 < passes.length ? passes[k + 1] : run.length - 1;
    let moves = 0;
    for (let f = lit + 1; f <= end; f++) if (run.stepAt(f)?.type === "swap") moves++;
    const value = run.valuesAt(lit)[picked];
    return {
      kind: "choice",
      // Asked with the pass lit on screen, before its first comparison.
      at: lit + 1,
      run,
      prompt: text.slides(value),
      options: choicesAround(moves, [], 0, picked),
      answer: moves,
      labels: [run.frameAt(lit).order[picked]],
      explain: (right) => `${right ? verdict.right : verdict.its(moves)}: ${text.slidesWhy(value, moves)}`,
    };
  });
};

/** Each sorting algorithm's key-moment questions; one entry per algorithm. */
const sortBuilders: Partial<Record<Algorithm, (run: Timeline) => Question[]>> = {
  selection: selectionQuestions,
  insertion: insertionQuestions,
  bubble: bubbleQuestions,
  cocktail: cocktailQuestions,
  shell: shellQuestions,
  quick: quickQuestions,
  merge: mergeQuestions,
  heap: heapQuestions,
  radix: radixQuestions,
};

/** Sorting: each algorithm asks about its key moment. Algorithms without one yet ask nothing. */
export const sortQuestions = (run: Timeline, algorithm: Algorithm): Question[] =>
  sortBuilders[algorithm]?.(run) ?? [];
