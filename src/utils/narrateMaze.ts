import { localized } from "@/i18n";
import type { MazeFrame, MazeRun } from "@/mazes";
import { count } from "./count";

type Direction = "up" | "right" | "down" | "left";

const text = localized({
  en: {
    at: (row: number, col: number) => `row ${row}, column ${col}`,
    ready: "Press play to carve a maze. Every cell starts walled in.",
    start: (at: string) => `Start at ${at}: carve it and push it on the stack.`,
    direction: { up: "up", right: "right", down: "down", left: "left" } as Record<Direction, string>,
    carve: (direction: string, at: string, stack: number) =>
      `Carve ${direction} into ${at} and push it. Stack: ${count(stack, "cell")}.`,
    backtrack: (at: string) => `No uncarved neighbours: pop it, back to ${at}.`,
    empty: "No uncarved neighbours and the stack is empty: every cell is carved.",
    done: (deadEnds: number, steps: number) =>
      `Done: a perfect maze with ${count(deadEnds, "dead-end cell")}, in ${count(steps, "step")}.`,
    described: (steps: number, deadEnds: number | null) =>
      `${count(steps, "step")}.${deadEnds === null ? "" : ` ${count(deadEnds, "dead-end cell")}.`}`,
  },
  es: {
    at: (row, col) => `la fila ${row}, columna ${col}`,
    ready: "Presiona play para excavar un laberinto. Todas las celdas empiezan amuralladas.",
    start: (at) => `Empieza en ${at}: excávala y ponla en la pila.`,
    direction: { up: "hacia arriba", right: "a la derecha", down: "hacia abajo", left: "a la izquierda" },
    carve: (direction, at, stack) => `Excava ${direction} hasta ${at} y apílala. Pila: ${count(stack, "celda")}.`,
    backtrack: (at) => `Sin vecinas por excavar: desapílala y vuelve a ${at}.`,
    empty: "Sin vecinas por excavar y la pila vacía: todas las celdas están excavadas.",
    done: (deadEnds, steps) =>
      `Listo: un laberinto perfecto con ${count(deadEnds, "celda sin salida", "celdas sin salida")}, en ${count(steps, "paso")}.`,
    described: (steps, deadEnds) =>
      `${count(steps, "paso")}.${deadEnds === null ? "" : ` ${count(deadEnds, "celda sin salida", "celdas sin salida")}.`}`,
  },
});

/** Where a cell is, counting maze cells (not walls) from 1. */
const at = (run: MazeRun, cell: number) =>
  text.at((Math.floor(cell / run.cols) + 1) / 2, ((cell % run.cols) + 1) / 2);

/** Which way `cell` lies from the wall it was carved through. */
const directionOf = (run: MazeRun, wall: number, cell: number): Direction =>
  cell === wall - run.cols ? "up" : cell === wall + 1 ? "right" : cell === wall + run.cols ? "down" : "left";

/** One plain-language sentence for the decision that led to frame `index`. */
export const narrateMaze = (run: MazeRun, index: number): string => {
  const step = run.stepAt(index);
  if (!step) return text.ready;
  const frame = run.frameAt(index);
  switch (step.type) {
    case "start":
      return text.start(at(run, step.cell));
    case "carve":
      return text.carve(text.direction[directionOf(run, step.wall, step.cell)], at(run, step.cell), frame.stack);
    case "backtrack":
      return frame.current === null ? text.empty : text.backtrack(at(run, frame.current));
    case "done":
      return text.done(step.deadEnds.length, frame.stats.steps);
  }
};

/** What a frame shows, in words, for screen readers. */
export const describeMazeFrame = (frame: MazeFrame) => text.described(frame.stats.steps, frame.stats.deadEnds);
