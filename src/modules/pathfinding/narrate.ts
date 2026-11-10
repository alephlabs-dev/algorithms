import { localized } from "@/i18n";
import { colOf, rowOf } from "./grid";
import type { PathAlgorithm } from "./types";
import type { PathTimeline } from "./timeline";
import { count } from "@/utils/count";

const text = localized({
  en: {
    frontier: { bfs: "queue", dfs: "stack", dijkstra: "open set", astar: "open set", greedy: "open set" } as Record<PathAlgorithm, string>,
    at: (row: number, col: number) => `row ${row}, column ${col}`,
    start: "Press play to start the search. Drag on the grid to draw walls, or move the start and target.",
    fromStart: "Start the search from the green dot.",
    reached: "Reached the target!",
    steps: (n: number) => count(n, "step"),
    cost: (n: number) => `cost ${n}`,
    look: (at: string, unit: string) => `Look at ${at}, ${unit} from the start.`,
    putStart: (frontier: string) => `Put the start in the ${frontier}.`,
    add: (n: number, frontier: string) => `Add ${count(n, "neighbour")} to the ${frontier}.`,
    traceBack: "Trace the path back from the target to the start.",
    pathSoFar: (n: number) => `Path: ${count(n, "step")} so far.`,
    noPath: (visited: number) => `No path: the target can't be reached. Looked at ${count(visited, "cell")}.`,
    mudCost: (cost: number) => ` (cost ${cost}, mud included)`,
    found: (length: number, cost: string, visited: number) =>
      `Found a path of ${count(length, "step")}${cost}, after looking at ${count(visited, "cell")}.`,
  },
  es: {
    frontier: { bfs: "la cola", dfs: "la pila", dijkstra: "el conjunto abierto", astar: "el conjunto abierto", greedy: "el conjunto abierto" },
    at: (row, col) => `fila ${row}, columna ${col}`,
    start: "Presiona play para buscar. Arrastra para dibujar paredes, o mueve el inicio y el destino.",
    fromStart: "Empieza la búsqueda desde el punto verde.",
    reached: "¡Llegó al destino!",
    steps: (n) => count(n, "paso"),
    cost: (n) => `costo ${n}`,
    look: (at, unit) => `Revisa ${at}, a ${unit} del inicio.`,
    putStart: (frontier) => `Pon el inicio en ${frontier}.`,
    add: (n, frontier) => `Agrega ${count(n, "vecino")} a ${frontier}.`,
    traceBack: "Reconstruye el camino desde el destino hasta el inicio.",
    pathSoFar: (n) => `Camino: ${count(n, "paso")} hasta ahora.`,
    noPath: (visited) => `No hay camino: el destino es inalcanzable. Se revisaron ${count(visited, "celda")}.`,
    mudCost: (cost) => ` (costo ${cost}, con barro)`,
    found: (length, cost, visited) =>
      `Encontró un camino de ${count(length, "paso")}${cost}, tras revisar ${count(visited, "celda")}.`,
  },
});

/** One plain-language sentence for the search step that led to frame `index`. */
export const narratePath = (timeline: PathTimeline, index: number, algorithm: PathAlgorithm): string => {
  const step = timeline.stepAt(index);
  const { grid } = timeline;
  const at = (cell: number) => text.at(rowOf(grid, cell) + 1, colOf(grid, cell) + 1);
  if (!step) return text.start;

  switch (step.type) {
    case "visit": {
      if (step.cell === grid.start) return text.fromStart;
      if (step.cell === grid.end) return text.reached;
      const unit = algorithm === "bfs" || algorithm === "dfs" ? text.steps(step.cost) : text.cost(step.cost);
      return text.look(at(step.cell), unit);
    }
    case "frontier":
      if (step.cells.length === 1 && step.cells[0] === grid.start) return text.putStart(text.frontier[algorithm]);
      return text.add(step.cells.length, text.frontier[algorithm]);
    case "path": {
      const frame = timeline.frameAt(index);
      if (step.cell === grid.start) return text.traceBack;
      return text.pathSoFar(frame.stats.pathLength);
    }
    case "done": {
      const { stats } = timeline.frameAt(index);
      if (!step.found) return text.noPath(stats.visited);
      const cost = stats.pathCost !== stats.pathLength ? text.mudCost(stats.pathCost) : "";
      return text.found(stats.pathLength, cost, stats.visited);
    }
  }
};
