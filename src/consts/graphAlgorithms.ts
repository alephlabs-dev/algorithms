import type { GraphAlgorithm } from "@/graphs";

type GraphAlgorithmDetails = {
  title: string;
  /** Short name for tight spots (pickers on phones). */
  short: string;
  shortDescription: string;
  longDescription: string;
  /** What it keeps the nodes to visit in, as the strip under the graph calls it. */
  structure: string;
  /**
   * What the badge on each node says: its distance from the start, when it was
   * visited, the cheapest edge that would add it to the tree, which group it's
   * in, or how many edges still come into it (then where it was placed).
   */
  label: "distance" | "order" | "key" | "group" | "indegree";
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
  prim: {
    title: "Prim's Algorithm",
    short: "Prim",
    shortDescription:
      "Grows one tree from the start, always adding the cheapest edge that reaches a new node. Ends with the lightest tree that joins them all.",
    longDescription:
      "Prim's algorithm builds a minimum spanning tree: the set of edges that connects every node with the smallest total weight. It starts from one node and keeps, for each node outside the tree, the cheapest edge that would bring it in (its key). Each round it adds the node with the smallest key, then looks along that node's edges to see if any outside node now has a cheaper way in. It's Dijkstra with one change: the key is the weight of a single edge, not the distance from the start. Spanning trees are how you'd lay the least cable between buildings. With a binary heap it runs in O((V + E) log V).",
    structure: "Priority queue",
    label: "key",
    weighted: true,
    timeComplexity: "O((V + E) log V)",
  },
  kruskal: {
    title: "Kruskal's Algorithm",
    short: "Kruskal",
    shortDescription:
      "Takes edges lightest first and keeps each one that joins two separate groups. Many small trees merge into one.",
    longDescription:
      "Kruskal's algorithm also builds a minimum spanning tree, but edge by edge instead of node by node. It sorts every edge by weight and goes through them, lightest first. Each node starts in a group of its own; an edge whose ends are in different groups goes in the tree and merges the two groups, and an edge whose ends are already in the same group is skipped, since it would close a loop. Keeping track of the groups is the job of a union-find structure. Prim and Kruskal always end with trees of the same total weight. Sorting dominates: O(E log E).",
    structure: "Edges, lightest first",
    label: "group",
    weighted: true,
    timeComplexity: "O(E log E)",
  },
  topo: {
    title: "Topological Sort",
    short: "Topo sort",
    shortDescription:
      "Puts the nodes of a directed graph in an order where every edge points forwards, like tasks after the tasks they depend on.",
    longDescription:
      "A topological sort orders the nodes of a directed graph so that every edge goes from an earlier node to a later one: courses after their prerequisites, build steps after the steps they need. Kahn's algorithm counts the edges coming into each node and starts with the nodes that have none. Each time it places a node, it crosses out the edges leading out of it; a node whose count drops to zero is ready to be placed. If nodes are left over at the end, the graph has a loop and no such order exists. On an undirected graph, edges here point from the earlier letter to the later one. It runs in O(V + E) time.",
    structure: "Ready list",
    label: "indegree",
    weighted: false,
    timeComplexity: "O(V + E)",
  },
};
