import type { Route } from "@/routes";
import { graphAlgorithms } from "./graphAlgorithms";
import { pathAlgorithms } from "./pathAlgorithms";
import { sortingAlgorithms } from "./sortingAlgorithms";

export type ModuleInfo = {
  id: string;
  title: string;
  summary: string;
  /** How much is in it, e.g. "9 algorithms". Modules still in preparation have none. */
  count?: string;
  /** Its own page. Modules still in preparation have none. */
  route?: Route;
};

/** Every module, open ones first, in the order the landing page lists them. */
export const modules: ModuleInfo[] = [
  {
    id: "sorting",
    title: "Sorting",
    summary: "Selection, Insertion, Bubble, Cocktail, Shell, Quick, Merge, Heap and Radix Sort.",
    count: `${Object.keys(sortingAlgorithms).length} algorithms`,
    route: { kind: "sorting" },
  },
  {
    id: "pathfinding",
    title: "Pathfinding",
    summary: "Breadth-first, depth-first, Dijkstra, A* and greedy search, on a grid you draw.",
    count: `${Object.keys(pathAlgorithms).length} searches`,
    route: { kind: "pathfinding" },
  },
  {
    id: "graphs",
    title: "Graphs",
    summary: "Breadth-first, depth-first and Dijkstra on a graph you can reshape, with the queue and stack shown.",
    count: `${Object.keys(graphAlgorithms).length} algorithms`,
    route: { kind: "graphs" },
  },
  { id: "structures", title: "Data structures", summary: "Binary search trees, AVL rotations, heaps and hash tables." },
  { id: "dp", title: "Dynamic programming", summary: "Edit distance, LCS and knapsack, one table cell at a time." },
  { id: "fourier", title: "Fourier series", summary: "Circles on circles that draw any shape." },
];
