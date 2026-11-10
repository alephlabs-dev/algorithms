// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Backtracking landing entry moves into its manifest.
import { backtrackingProblems } from "../modules/backtracking/algorithms";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the DP landing entry moves into its manifest.
import { dpProblems } from "../modules/dp/algorithms";
import type { Route } from "@/routes";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Fourier landing entry moves into its manifest.
import { fourierSeries } from "../modules/fourier/algorithms";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Data structures landing entry moves into its manifest.
import { structures } from "../modules/structures/algorithms";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Graphs landing entry moves into its manifest.
import { graphAlgorithms } from "../modules/graphs/algorithms";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Mazes landing entry moves into its manifest.
import { MAZE_ALGORITHMS } from "@/modules/mazes/generators";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Pathfinding landing entry moves into its manifest.
import { pathAlgorithms } from "../modules/pathfinding/algorithms";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Sorting landing entry moves into its manifest.
import { sortingAlgorithms } from "../modules/sorting/algorithms";
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
    mazes: "Mazes",
    algorithms: (n: number) => (n === 1 ? "1 algorithm" : `${n} algorithms`),
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
      backtracking: "N queens on a chessboard and a Sudoku, filled one choice at a time: every conflict, every dead end and every choice taken back.",
      mazes: "A perfect maze carved one decision at a time by randomized depth-first search: every carve, every backtrack and every dead-end cell.",
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
    mazes: "Laberintos",
    algorithms: (n) => (n === 1 ? "1 algoritmo" : `${n} algoritmos`),
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
      backtracking: "N reinas en un tablero de ajedrez y un sudoku, elección por elección: cada conflicto, cada callejón sin salida y cada elección que se deshace.",
      mazes: "Un laberinto perfecto excavado decisión por decisión con la búsqueda en profundidad aleatoria: cada pasillo, cada retroceso y cada celda sin salida.",
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
    route: { module: "sorting", page: "start" },
  },
  {
    id: "pathfinding",
    title: text.pathfinding,
    summary: text.summaries.pathfinding,
    count: text.searches(Object.keys(pathAlgorithms).length),
    route: { module: "pathfinding", page: "start" },
  },
  {
    id: "graphs",
    title: text.graphs,
    summary: text.summaries.graphs,
    count: text.algorithms(Object.keys(graphAlgorithms).length),
    route: { module: "graphs", page: "start" },
  },
  {
    id: "fourier",
    title: text.fourier,
    summary: text.summaries.fourier,
    count: text.series(Object.keys(fourierSeries).length),
    route: { module: "fourier", page: "start" },
  },
  {
    id: "structures",
    title: text.structures,
    summary: text.summaries.structures,
    count: text.structureCount(Object.keys(structures).length),
    route: { module: "structures", page: "start" },
  },
  {
    id: "dp",
    title: text.dp,
    summary: text.summaries.dp,
    count: text.problems(Object.keys(dpProblems).length),
    route: { module: "dp", page: "start" },
  },
  {
    id: "backtracking",
    title: text.backtracking,
    summary: text.summaries.backtracking,
    count: text.problems(Object.keys(backtrackingProblems).length),
    route: { module: "backtracking", page: "start" },
  },
  {
    id: "mazes",
    title: text.mazes,
    summary: text.summaries.mazes,
    count: text.algorithms(MAZE_ALGORITHMS.length),
    route: { module: "mazes", page: "start" },
  },
];
