import { dpProblems } from "./dp";
import type { Route } from "@/routes";
import { fourierSeries } from "./fourierSeries";
import { structures } from "./structures";
import { graphAlgorithms } from "./graphAlgorithms";
import { pathAlgorithms } from "./pathAlgorithms";
import { sortingAlgorithms } from "./sortingAlgorithms";
import { localized } from "@/i18n";

// The landing page's summaries are translated with the landing page (#69).
const text = localized({
  en: {
    sorting: "Sorting",
    pathfinding: "Pathfinding",
    graphs: "Graphs",
    fourier: "Fourier series",
    structures: "Data structures",
    dp: "Dynamic programming",
    algorithms: (n: number) => `${n} algorithms`,
    searches: (n: number) => `${n} searches`,
    series: (n: number) => `${n} series`,
    structureCount: (n: number) => `${n} structures`,
    problems: (n: number) => `${n} problems`,
  },
  es: {
    sorting: "Ordenamiento",
    pathfinding: "Búsqueda de caminos",
    graphs: "Grafos",
    fourier: "Series de Fourier",
    structures: "Estructuras de datos",
    dp: "Programación dinámica",
    algorithms: (n) => `${n} algoritmos`,
    searches: (n) => `${n} búsquedas`,
    series: (n) => `${n} series`,
    structureCount: (n) => `${n} estructuras`,
    problems: (n) => `${n} problemas`,
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
    summary: "Selection, Insertion, Bubble, Cocktail, Shell, Quick, Merge, Heap and Radix Sort.",
    count: text.algorithms(Object.keys(sortingAlgorithms).length),
    route: { kind: "sorting" },
  },
  {
    id: "pathfinding",
    title: text.pathfinding,
    summary: "Breadth-first, depth-first, Dijkstra, A* and greedy search, on a grid you draw.",
    count: text.searches(Object.keys(pathAlgorithms).length),
    route: { kind: "pathfinding" },
  },
  {
    id: "graphs",
    title: text.graphs,
    summary: "BFS, DFS, Dijkstra, Prim, Kruskal and topological sort on a graph you can reshape.",
    count: text.algorithms(Object.keys(graphAlgorithms).length),
    route: { kind: "graphs" },
  },
  {
    id: "fourier",
    title: text.fourier,
    summary: "Square, sawtooth and triangle waves built from circles, and circles on circles that draw any shape.",
    count: text.series(Object.keys(fourierSeries).length),
    route: { kind: "fourier" },
  },
  {
    id: "structures",
    title: text.structures,
    summary: "Search trees, AVL rotations, a min-heap and hash tables you insert into, search and delete from.",
    count: text.structureCount(Object.keys(structures).length),
    route: { kind: "structures" },
  },
  {
    id: "dp",
    title: text.dp,
    summary: "Edit distance, the longest common subsequence and the knapsack, one table cell at a time, and a race against plain recursion.",
    count: text.problems(Object.keys(dpProblems).length),
    route: { kind: "dp" },
  },
];
