import { backtrackingProblems } from "./backtracking";
import { dpProblems } from "./dp";
import type { Route } from "@/routes";
import { fourierSeries } from "./fourierSeries";
import { structures } from "./structures";
import { graphAlgorithms } from "./graphAlgorithms";
import { pathAlgorithms } from "./pathAlgorithms";
import { sortingAlgorithms } from "./sortingAlgorithms";
import { localized } from "@/i18n";

const text = localized({
  en: {
    sorting: "Sorting",
    pathfinding: "Pathfinding",
    graphs: "Graphs",
    fourier: "Fourier series",
    structures: "Data structures",
    dp: "Dynamic programming",
    backtracking: "Backtracking",
    algorithms: (n: number) => `${n} algorithms`,
    searches: (n: number) => `${n} searches`,
    series: (n: number) => `${n} series`,
    structureCount: (n: number) => `${n} structures`,
    problems: (n: number) => (n === 1 ? "1 problem" : `${n} problems`),
    summaries: {
      sorting: "Selection, Insertion, Bubble, Cocktail, Shell, Quick, Merge, Heap and Radix Sort.",
      pathfinding: "Breadth-first, depth-first, Dijkstra, A* and greedy search, on a grid you draw.",
      graphs: "BFS, DFS, Dijkstra, Prim, Kruskal and topological sort on a graph you can reshape.",
      fourier: "Square, sawtooth and triangle waves built from circles, and circles on circles that draw any shape.",
      structures: "Search trees, AVL rotations, a min-heap and hash tables you insert into, search and delete from.",
      dp: "Edit distance, the longest common subsequence and the knapsack, one table cell at a time, and a race against plain recursion.",
      backtracking: "N queens on a chessboard, placed one row at a time: every conflict, every dead end and every queen taken back.",
    },
  },
  es: {
    sorting: "Ordenamiento",
    pathfinding: "Búsqueda de caminos",
    graphs: "Grafos",
    fourier: "Series de Fourier",
    structures: "Estructuras de datos",
    dp: "Programación dinámica",
    backtracking: "Backtracking",
    algorithms: (n) => `${n} algoritmos`,
    searches: (n) => `${n} búsquedas`,
    series: (n) => `${n} series`,
    structureCount: (n) => `${n} estructuras`,
    problems: (n) => (n === 1 ? "1 problema" : `${n} problemas`),
    summaries: {
      sorting: "Selection, Insertion, Bubble, Cocktail, Shell, Quick, Merge, Heap y Radix Sort.",
      pathfinding: "Búsqueda en anchura, en profundidad, Dijkstra, A* y búsqueda voraz, en una cuadrícula que tú dibujas.",
      graphs: "BFS, DFS, Dijkstra, Prim, Kruskal y orden topológico en un grafo que puedes modificar.",
      fourier: "Ondas cuadradas, de sierra y triangulares hechas con círculos, y círculos sobre círculos que dibujan cualquier forma.",
      structures: "Árboles de búsqueda, rotaciones AVL, un montículo mínimo y tablas hash donde insertas, buscas y borras.",
      dp: "Distancia de edición, la subsecuencia común más larga y la mochila, celda por celda, y una carrera contra la recursión simple.",
      backtracking: "N reinas en un tablero de ajedrez, fila por fila: cada conflicto, cada callejón sin salida y cada reina que se quita.",
    },
  },
});

export type ModuleInfo = {
  id: string;
  title: string;
  summary: string;
  /** How much is in it, e.g. "9 algorithms". Modules still in preparation have none. */
  count?: string;
  /** Its own page. Modules still in preparation have none. */
  route?: Route;
};

/** Every module, open ones first (newest last), in the order the landing page lists them. */
export const modules: ModuleInfo[] = [
  {
    id: "sorting",
    title: text.sorting,
    summary: text.summaries.sorting,
    count: text.algorithms(Object.keys(sortingAlgorithms).length),
    route: { kind: "sorting" },
  },
  {
    id: "pathfinding",
    title: text.pathfinding,
    summary: text.summaries.pathfinding,
    count: text.searches(Object.keys(pathAlgorithms).length),
    route: { kind: "pathfinding" },
  },
  {
    id: "graphs",
    title: text.graphs,
    summary: text.summaries.graphs,
    count: text.algorithms(Object.keys(graphAlgorithms).length),
    route: { kind: "graphs" },
  },
  {
    id: "fourier",
    title: text.fourier,
    summary: text.summaries.fourier,
    count: text.series(Object.keys(fourierSeries).length),
    route: { kind: "fourier" },
  },
  {
    id: "structures",
    title: text.structures,
    summary: text.summaries.structures,
    count: text.structureCount(Object.keys(structures).length),
    route: { kind: "structures" },
  },
  {
    id: "dp",
    title: text.dp,
    summary: text.summaries.dp,
    count: text.problems(Object.keys(dpProblems).length),
    route: { kind: "dp" },
  },
  {
    id: "backtracking",
    title: text.backtracking,
    summary: text.summaries.backtracking,
    count: text.problems(Object.keys(backtrackingProblems).length),
    route: { kind: "backtracking" },
  },
];
