import { localized } from "@/i18n";
import { FRONTIER, isMazeCell, WALL, type MazeFrame, type MazeRun } from "@/mazes";
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
    first: (at: string) => `Start at ${at}: the first cell in the maze.`,
    walkStart: (at: string) => `Start a random walk at ${at}, outside the maze.`,
    walk: (direction: string, at: string) => `Walk ${direction} to ${at}.`,
    walkLoop: (direction: string, at: string) => `Walk ${direction} to ${at}: the walk crosses itself.`,
    walkMaze: (direction: string, at: string) => `Walk ${direction} to ${at}: it reaches the maze.`,
    erase: (cells: number, at: string) => `Erase the loop: ${count(cells, "cell")} off the walk, back to ${at}.`,
    carveWalk: (cells: number) => `Carve the whole walk into the maze: ${count(cells, "new cell")}.`,
    lastCarveWalk: (cells: number) =>
      `Carve the whole walk into the maze: ${count(cells, "new cell")}. Every cell is in.`,
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
    regions: (n) => `Excava todas las celdas, cada una en su propia región: ${count(n, "región", "regiones")}.`,
    join: (at, left) =>
      `La pared en ${at} separa dos regiones: excávala y únelas; ${left === 1 ? "queda" : "quedan"} ${count(left, "región", "regiones")}.`,
    lastJoin: (at) => `La pared en ${at} separa las dos últimas regiones: excávala y todo queda unido.`,
    skip: (at) => `La pared en ${at} está dentro de una región: omítela, cerraría un ciclo.`,
    first: (at) => `Empieza en ${at}: la primera celda del laberinto.`,
    walkStart: (at) => `Empieza una caminata al azar en ${at}, fuera del laberinto.`,
    walk: (direction, at) => `Camina ${direction} hasta ${at}.`,
    walkLoop: (direction, at) => `Camina ${direction} hasta ${at}: la caminata se cruza consigo misma.`,
    walkMaze: (direction, at) => `Camina ${direction} hasta ${at}: llega al laberinto.`,
    erase: (cells, at) => `Borra el ciclo: saca ${count(cells, "celda")} de la caminata y vuelve a ${at}.`,
    carveWalk: (cells) =>
      `Excava toda la caminata en el laberinto: ${count(cells, "celda nueva", "celdas nuevas")}.`,
    lastCarveWalk: (cells) =>
      `Excava toda la caminata en el laberinto: ${count(cells, "celda nueva", "celdas nuevas")}. Ya están todas.`,
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
    case "join":
      return step.left === 1 ? text.lastJoin(at(run, step.wall)) : text.join(at(run, step.wall), step.left);
    case "skip":
      return text.skip(at(run, step.wall));
    case "first":
      return text.first(at(run, step.cell));
    case "walkStart":
      return text.walkStart(at(run, step.cell));
    case "walk": {
      const sentence = { new: text.walk, loop: text.walkLoop, maze: text.walkMaze }[step.to];
      return sentence(text.direction[directionOf(run, step.wall, step.cell)], at(run, step.cell));
    }
    case "erase":
      return text.erase(step.erased.filter((cell) => isMazeCell(run, cell)).length, at(run, step.cell));
    case "carveWalk": {
      const cells = step.carved.filter((cell) => isMazeCell(run, cell)).length;
      const everyCellIn = frame.states.every((state, cell) => state !== WALL || !isMazeCell(run, cell));
      return everyCellIn ? text.lastCarveWalk(cells) : text.carveWalk(cells);
    }
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
