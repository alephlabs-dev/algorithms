import { localized } from "@/i18n";
import { colOf, manhattan, neighbors, rowOf, stepCost } from "./grid";
import type { PathAlgorithm } from "./types";
import type { PathTimeline } from "./timeline";
import { count } from "@/utils/count";
import { verdict } from "@/game/choices";
import type { Question } from "@/game/questions";
import { spread, type Candidate } from "@/game/spread";

/** At least this many visits between two questions. */
const GAP = 6;

/** The letters marked on the candidate cells, in reading order. */
const CELL_LETTERS = ["A", "B", "C", "D"];

/** Each question offers the answer and up to three cells that lose to it; never fewer than two. */
const MAX_DISTRACTORS = 3;
const MIN_DISTRACTORS = 2;

/** A cell waiting in the frontier, with what each search orders it by. */
type Waiting = {
  /** Steps from the start (BFS, DFS) or cost to reach it (the others), as the search knows it now. */
  cost: number;
  /** DFS: how many visits had happened when it was last pushed; newer is taken first. */
  pushed: number;
};

/** One time the search takes a cell out of the frontier: what it takes, and what it could have taken. */
type Visit = Candidate & {
  cell: number;
  /** The cell visited just before, outlined on screen. */
  current: number | null;
  frontier: Map<number, Waiting>;
};

/** "A and B", "A, B and C" */
const list = (items: string[], and: string) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;

/** Letters that share a number: the answer alone, the others grouped (A* lists each cell on its own). */
type Numbers = { letters: string[]; value: number; shown: string };

/** "B, C and D are 5", "B is 5" */
const are = (o: Numbers, and: string, one: string, many: string) =>
  `${list(o.letters, and)} ${o.letters.length === 1 ? one : many}`;

const text = localized({
  en: {
    prompt: "Which cell will the search visit next? Tap a letter.",
    its: (letter: string) => `It's ${letter}`,
    // Each search's rule, then the numbers that decide it: the answer's, then the others' from closest to farthest.
    bfs: (answer: Numbers, others: Numbers[]) =>
      `BFS takes the nearest ring first. ${answer.letters[0]} is ${count(answer.value, "step")} from the start; ${others
        .map((o) => `${are(o, "and", "is", "are")} ${o.shown}`)
        .join(", ")}.`,
    dfs: (answer: Numbers, others: Numbers[]) =>
      `DFS takes the newest cell on the stack. ${answer.letters[0]} was added ${
        answer.value === 0 ? "on the last visit" : `${count(answer.value, "visit")} ago`
      }; ${others.map((o) => `${list(o.letters, "and")} ${count(o.value, "visit")} ago`).join(", ")}.`,
    dijkstra: (answer: Numbers, others: Numbers[]) =>
      `Dijkstra takes the lowest cost. ${answer.letters[0]} costs ${answer.shown} to reach; ${others
        .map((o) => `${are(o, "and", "costs", "cost")} ${o.shown}`)
        .join(", ")}.`,
    astar: (answer: Numbers, others: Numbers[]) =>
      `A* takes the lowest cost + distance left. ${answer.letters[0]}: ${answer.shown}; ${others
        .map((o) => `${o.letters[0]}: ${o.shown}`)
        .join(", ")}.`,
    greedy: (answer: Numbers, others: Numbers[]) =>
      `Greedy takes the cell closest to the target. ${answer.letters[0]} is ${count(answer.value, "step")} away; ${others
        .map((o) => `${are(o, "and", "is", "are")} ${o.shown}`)
        .join(", ")}.`,
    at: (letter: string, row: number, col: number) => `${letter}: row ${row}, column ${col}`,
  },
  es: {
    prompt: "¿Qué celda visitará la búsqueda ahora? Toca una letra.",
    its: (letter) => `Es ${letter}`,
    bfs: (answer, others) =>
      `BFS toma primero el anillo más cercano. ${answer.letters[0]} está a ${count(answer.value, "paso")} del inicio; ${others
        .map((o) => `${are(o, "y", "está", "están")} a ${o.shown}`)
        .join(", ")}.`,
    dfs: (answer, others) =>
      `DFS toma la celda más nueva de la pila. ${answer.letters[0]} entró ${
        answer.value === 0 ? "en la última visita" : `hace ${count(answer.value, "visita")}`
      }; ${others.map((o) => `${list(o.letters, "y")}, hace ${count(o.value, "visita")}`).join(", ")}.`,
    dijkstra: (answer, others) =>
      `Dijkstra toma el menor costo. Llegar a ${answer.letters[0]} cuesta ${answer.shown}; ${others
        .map((o) => `a ${list(o.letters, "y")}, ${o.shown}`)
        .join(", ")}.`,
    astar: (answer, others) =>
      `A* toma el menor costo + distancia restante. ${answer.letters[0]}: ${answer.shown}; ${others
        .map((o) => `${o.letters[0]}: ${o.shown}`)
        .join(", ")}.`,
    greedy: (answer, others) =>
      `Voraz toma la celda más cercana al destino. ${answer.letters[0]} está a ${count(answer.value, "paso")}; ${others
        .map((o) => `${are(o, "y", "está", "están")} a ${o.shown}`)
        .join(", ")}.`,
    at: (letter, row, col) => `${letter}: fila ${row}, columna ${col}`,
  },
});

/** Every visit of the run, with the frontier just before it. */
const visitsOf = (run: PathTimeline, algorithm: PathAlgorithm): Visit[] => {
  const { grid } = run;
  const frontier = new Map<number, Waiting>();
  const visits: Visit[] = [];
  let current: number | null = null;
  let currentCost = 0;
  // BFS and DFS count steps; the others add up what each step costs.
  const counts = algorithm === "bfs" || algorithm === "dfs";
  for (let at = 1; at < run.length; at++) {
    const step = run.stepAt(at)!;
    if (step.type === "visit") {
      visits.push({ at, k: visits.length + 1, cell: step.cell, current, frontier: new Map(frontier) });
      frontier.delete(step.cell);
      current = step.cell;
      currentCost = step.cost;
    } else if (step.type === "frontier") {
      for (const cell of step.cells) {
        const cost = current === null ? 0 : currentCost + (counts ? 1 : stepCost(grid, cell));
        frontier.set(cell, { cost, pushed: visits.length });
      }
    }
  }
  return visits;
};

/**
 * The number each search orders its frontier by, as the explanation shows it; the lowest
 * is visited next. DFS counts visits since a cell was pushed: the newest has 0.
 */
const decisive = (run: PathTimeline, algorithm: PathAlgorithm, visit: Visit) => (cell: number) => {
  const { grid } = run;
  const w = visit.frontier.get(cell)!;
  switch (algorithm) {
    case "bfs":
    case "dijkstra":
      return w.cost;
    case "dfs":
      return visit.k - 1 - w.pushed;
    case "astar":
      return w.cost + manhattan(grid, cell, grid.end);
    case "greedy":
      return manhattan(grid, cell, grid.end);
  }
};

/**
 * The cells guess mode offers for a visit: the answer and the three that lose to it by
 * the least (two where only two lose), always for a reason the explanation can show:
 * never one tied with the answer. In DFS never another neighbour of the cell just
 * visited either, since the order neighbours are pushed in isn't on screen. Null when
 * fewer than two lose.
 */
const candidatesOf = (run: PathTimeline, algorithm: PathAlgorithm, visit: Visit) => {
  const { grid } = run;
  const left = (cell: number) => manhattan(grid, cell, grid.end);
  const value = decisive(run, algorithm, visit);
  const best = value(visit.cell);
  const beside = new Set(visit.current === null ? [] : neighbors(grid, visit.current));
  const losers = [...visit.frontier.keys()]
    .filter((cell) => value(cell) > best && !(algorithm === "dfs" && beside.has(cell)))
    .sort((a, b) => value(a) - value(b) || left(a) - left(b) || a - b);
  if (losers.length < MIN_DISTRACTORS) return null;
  return { cells: [visit.cell, ...losers.slice(0, MAX_DISTRACTORS)].sort((a, b) => a - b), value };
};

/**
 * Pathfinding: which marked cell the search visits next. At most ten per run, spread
 * over it, at least six visits apart, and only where two or three other cells lose for a
 * reason the explanation can show.
 */
export const pathQuestions = (run: PathTimeline, algorithm: PathAlgorithm): Question[] => {
  const { grid } = run;
  const asked = visitsOf(run, algorithm).flatMap((visit) => {
    const found = candidatesOf(run, algorithm, visit);
    return found ? [{ ...visit, ...found }] : [];
  });
  return spread(asked, run.length, GAP).map(({ at, cell, cells, frontier, value }) => {
    const letter = (c: number) => CELL_LETTERS[cells.indexOf(c)];
    const shown = (c: number) =>
      algorithm === "astar" ? `${frontier.get(c)!.cost} + ${manhattan(grid, c, grid.end)} = ${value(c)}` : String(value(c));
    const numbers = (c: number): Numbers => ({ letters: [letter(c)], value: value(c), shown: shown(c) });
    // The others in the order they lose; those with the same number together, except in A*, where the sums differ in parts.
    const others: Numbers[] = [];
    for (const c of cells.filter((c) => c !== cell).sort((a, b) => value(a) - value(b) || a - b)) {
      const last = others[others.length - 1];
      if (last && algorithm !== "astar" && last.value === value(c)) last.letters.push(letter(c));
      else others.push(numbers(c));
    }
    const why = text[algorithm](numbers(cell), others);
    return {
      kind: "choice",
      at,
      run,
      prompt: text.prompt,
      options: cells,
      optionLabels: cells.map(letter),
      answer: cell,
      gridCells: true,
      marksText: cells.map((c) => text.at(letter(c), rowOf(grid, c) + 1, colOf(grid, c) + 1)).join("; "),
      explain: (right) => `${right ? verdict.right : text.its(letter(cell))}. ${why}`,
    };
  });
};
