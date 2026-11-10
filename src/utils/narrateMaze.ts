import { localized } from "@/i18n";
import { FRONTIER, type MazeFrame, type MazeRun } from "@/mazes";
import { count } from "./count";

type Direction = "up" | "right" | "down" | "left";

const text = localized({
  en: {
    at: (row: number, col: number) => `row ${row}, column ${col}`,
    ready: "Press play to carve a maze. Every cell starts walled in.",
    start: (at: string) => `Start at ${at}: carve it and push it on the stack.`,
    direction: { up: "up", right: "right", down: "down", left: "left" } as Record<Direction, string>,
    carve: (direction: string, at: string) => `Carve ${direction} into ${at} and push it on the stack.`,
    backtrack: (at: string) => `No uncarved neighbours: pop it, back to ${at}.`,
    empty: "No uncarved neighbours and the stack is empty: every cell is carved.",
    side: { up: "above", right: "the right", down: "below", left: "the left" } as Record<Direction, string>,
    frontierStart: (at: string, frontier: number) =>
      `Start at ${at}: carve it and put its ${count(frontier, "neighbour")} on the frontier.`,
    pick: (at: string, side: string, added: number) =>
      `Pick ${at}, carve in from ${side}${added ? `; ${count(added, "new frontier cell")}` : ""}.`,
    lastPick: (at: string, side: string) => `Pick ${at}, carve in from ${side}. The frontier is empty.`,
    regions: (n: number) => `Carve every cell, each its own region: ${count(n, "region")}.`,
    join: (at: string, left: number) =>
      `The wall at ${at} splits two regions: carve it and merge them; ${count(left, "region")} left.`,
    lastJoin: (at: string) => `The wall at ${at} splits the last two regions: carve it. Every cell is joined.`,
    skip: (at: string) => `The wall at ${at} is inside one region: skip it, it would make a loop.`,
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
    carve: (direction, at) => `Excava ${direction} hasta ${at} y ponla en la pila.`,
    backtrack: (at) => `Sin vecinas por excavar: desapílala y vuelve a ${at}.`,
    empty: "Sin vecinas por excavar y la pila vacía: todas las celdas están excavadas.",
    side: { up: "arriba", right: "la derecha", down: "abajo", left: "la izquierda" },
    frontierStart: (at, frontier) =>
      `Empieza en ${at}: excávala y pon sus ${count(frontier, "vecina")} en la frontera.`,
    pick: (at, side, added) =>
      `Elige ${at} y excava desde ${side}${added ? `; ${count(added, "celda nueva", "celdas nuevas")} en la frontera` : ""}.`,
    lastPick: (at, side) => `Elige ${at} y excava desde ${side}. La frontera queda vacía.`,
    regions: (n) => `Excava todas las celdas, cada una es una región: ${count(n, "región", "regiones")}.`,
    join: (at, left) =>
      `La pared en ${at} separa dos regiones: excávala y únelas; ${left === 1 ? "queda" : "quedan"} ${count(left, "región", "regiones")}.`,
    lastJoin: (at) => `La pared en ${at} separa las dos últimas regiones: excávala y todo queda unido.`,
    skip: (at) => `La pared en ${at} está dentro de una región: omítela, cerraría un ciclo.`,
    done: (deadEnds, steps) =>
      `Listo: un laberinto perfecto con ${count(deadEnds, "celda sin salida", "celdas sin salida")}, en ${count(steps, "paso")}.`,
    described: (steps, deadEnds) =>
      `${count(steps, "paso")}.${deadEnds === null ? "" : ` ${count(deadEnds, "celda sin salida", "celdas sin salida")}.`}`,
  },
});

/** Where a cell is on the grid as drawn, walls included, counting from 1 (like pathfinding). */
const at = (run: MazeRun, cell: number) => text.at(Math.floor(cell / run.cols) + 1, (cell % run.cols) + 1);

/** Which way `cell` lies from the wall it was carved through. */
const directionOf = (run: MazeRun, wall: number, cell: number): Direction =>
  cell === wall - run.cols ? "up" : cell === wall + 1 ? "right" : cell === wall + run.cols ? "down" : "left";

const OPPOSITE: Record<Direction, Direction> = { up: "down", right: "left", down: "up", left: "right" };

/** Kruskal's regions after frame `index`: one per cell to begin with, one fewer per carved wall. */
const regionsLeft = (run: MazeRun, index: number) => {
  let regions = 0;
  for (let i = 1; i <= index; i++) {
    const step = run.stepAt(i);
    if (step?.type === "regions") regions = step.cells.length;
    else if (step?.type === "join") regions--;
  }
  return regions;
};

/** One plain-language sentence for the decision that led to frame `index`. */
export const narrateMaze = (run: MazeRun, index: number): string => {
  const step = run.stepAt(index);
  if (!step) return text.ready;
  const frame = run.frameAt(index);
  switch (step.type) {
    case "start":
      return step.frontier
        ? text.frontierStart(at(run, step.cell), step.frontier.length)
        : text.start(at(run, step.cell));
    case "pick": {
      const where = at(run, step.cell);
      const side = text.side[OPPOSITE[directionOf(run, step.wall, step.cell)]];
      return frame.states.includes(FRONTIER)
        ? text.pick(where, side, step.frontier.length)
        : text.lastPick(where, side);
    }
    case "regions":
      return text.regions(step.cells.length);
    case "join": {
      const left = regionsLeft(run, index);
      return left === 1 ? text.lastJoin(at(run, step.wall)) : text.join(at(run, step.wall), left);
    }
    case "skip":
      return text.skip(at(run, step.wall));
    case "carve":
      return text.carve(text.direction[directionOf(run, step.wall, step.cell)], at(run, step.cell));
    case "backtrack":
      return frame.current === null ? text.empty : text.backtrack(at(run, frame.current));
    case "done":
      return text.done(step.deadEnds.length, frame.stats.steps);
  }
};

/** What a frame shows, in words, for screen readers. */
export const describeMazeFrame = (frame: MazeFrame) => text.described(frame.stats.steps, frame.stats.deadEnds);
