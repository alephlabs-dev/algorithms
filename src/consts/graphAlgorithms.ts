import type { GraphAlgorithm } from "@/graphs";

type GraphAlgorithmDetails = {
  title: string;
  /** Short name for tight spots (pickers on phones). */
  short: string;
  shortDescription: string;
  longDescription: string;
  /** What it keeps the nodes to visit in, as the strip under the graph calls it. */
  structure: string;
  /** What the number on each node means. */
  label: "distance" | "order";
  /** Uses edge weights (shows them on the edges). */
  weighted: boolean;
  timeComplexity: string;
};

// Key order is the order shown in the UI.
export const graphAlgorithms: Record<GraphAlgorithm, GraphAlgorithmDetails> = {
  bfs: {
    title: "Breadth-First Search",
    short: "BFS",
    shortDescription:
      "Visits every node one edge away, then two, then three, using a queue. The tree it leaves holds the fewest-edges route to every node.",
    longDescription:
      "Breadth-First Search (BFS) keeps the nodes to visit in a queue: first in, first out. It takes the start, adds all its neighbours to the back of the queue, then takes the next node from the front, and so on. Because nodes leave in the order they arrived, the search moves outwards in layers: everything at distance 1, then everything at distance 2. The edges it first reached each node by form a tree, and the path along that tree is the one with the fewest edges. It ignores weights. It runs in O(V + E) time, for V nodes and E edges.",
    structure: "Queue",
    label: "distance",
    weighted: false,
    timeComplexity: "O(V + E)",
  },
  dfs: {
    title: "Depth-First Search",
    short: "DFS",
    shortDescription:
      "Follows one branch as far as it goes, then backs up to the last node with an unvisited neighbour. The stack is the path it's on.",
    longDescription:
      "Depth-First Search (DFS) goes as deep as it can before it backtracks. From each node it takes the first neighbour it hasn't visited and goes there, keeping the nodes it came through on a stack. When a node has no unvisited neighbours left, it's done: DFS pops it and goes back to the node before. The stack is always a path from the start to where the search is now. DFS is the basis for finding cycles, connected parts and topological order. It runs in O(V + E) time.",
    structure: "Stack",
    label: "order",
    weighted: false,
    timeComplexity: "O(V + E)",
  },
  dijkstra: {
    title: "Dijkstra's Algorithm",
    short: "Dijkstra",
    shortDescription:
      "Always settles the closest node not yet settled, so it finds the cheapest route to every node when edges have weights.",
    longDescription:
      "Dijkstra's algorithm keeps the best known distance to each node and a set of open nodes, ordered by that distance (a priority queue). Each round it takes the open node with the smallest distance: no cheaper way to reach it can turn up later, so its distance is final. Then it looks along each edge from it, and if going through it makes a neighbour cheaper to reach, it lowers that neighbour's distance. With every weight equal it behaves like BFS. It needs weights that aren't negative. With a binary heap it runs in O((V + E) log V).",
    structure: "Priority queue",
    label: "distance",
    weighted: true,
    timeComplexity: "O((V + E) log V)",
  },
};
