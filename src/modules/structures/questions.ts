import type { Question, Slot } from "@/game";
import { choicesAround, verdict } from "@/game/choices";
import { localized } from "@/i18n";
import type { HashFrame, StructureRun, TreeFrame } from "./types";

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
