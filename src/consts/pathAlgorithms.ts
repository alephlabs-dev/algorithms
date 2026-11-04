import type { PathAlgorithm } from "@/pathfinding";

type PathAlgorithmDetails = {
  title: string;
  /** Short name for tight spots (pickers on phones). */
  short: string;
  shortDescription: string;
  longDescription: string;
  /** What it keeps the cells to explore in. */
  structure: string;
  /** Guarantees the shortest path: by steps, by cost, or not at all. */
  shortest: "steps" | "cost" | "no";
  /** Takes mud (cell costs) into account. */
  weighted: boolean;
  timeComplexity: string;
};

// Key order is the order shown in the UI.
export const pathAlgorithms: Record<PathAlgorithm, PathAlgorithmDetails> = {
  bfs: {
    title: "Breadth-First Search",
    short: "BFS",
    shortDescription:
      "Explores in rings around the start, so the first path it finds has the fewest steps. Ignores how costly each cell is.",
    longDescription:
      "Breadth-First Search (BFS) keeps the cells to explore in a queue: first in, first out. It looks at every cell one step away from the start, then every cell two steps away, and so on, so the search spreads in rings. The first time it reaches the target, no shorter path (in number of steps) can exist. It treats every step the same, so it walks straight through mud that a cost-aware search would go around. It runs in O(V + E) time, where V is the number of cells and E the connections between them.",
    structure: "Queue (first in, first out)",
    shortest: "steps",
    weighted: false,
    timeComplexity: "O(V + E)",
  },
  dfs: {
    title: "Depth-First Search",
    short: "DFS",
    shortDescription:
      "Follows one corridor as far as it goes before backtracking. Always finds a way if there is one, but rarely the shortest.",
    longDescription:
      "Depth-First Search (DFS) keeps the cells to explore in a stack: last in, first out. It takes the newest cell each time, so it dives down one direction until it hits a dead end, then backtracks to the last branch and tries the next. It's simple and uses little memory, and it's how the maze generator here carves its corridors, but the path it finds depends on the order it tries directions, and is often long and winding. It runs in O(V + E) time.",
    structure: "Stack (last in, first out)",
    shortest: "no",
    weighted: false,
    timeComplexity: "O(V + E)",
  },
  dijkstra: {
    title: "Dijkstra's Algorithm",
    short: "Dijkstra",
    shortDescription:
      "Always expands the cheapest cell reached so far, so it finds the lowest-cost path, going around mud when that's cheaper.",
    longDescription:
      "Dijkstra's algorithm tracks the cheapest known cost to reach each cell and always expands the open cell with the lowest one. When it takes a cell out, no cheaper way to reach it can appear later, so when the target comes out, its path is the cheapest possible. With every step costing the same it behaves like BFS; with mud it bends around expensive cells when the detour is cheaper. It explores in every direction equally, which is thorough but wasteful when the target is far to one side. With a priority queue it runs in O((V + E) log V).",
    structure: "Priority queue, by cost so far",
    shortest: "cost",
    weighted: true,
    timeComplexity: "O((V + E) log V)",
  },
  astar: {
    title: "A* Search",
    short: "A*",
    shortDescription:
      "Dijkstra with a sense of direction: ranks cells by cost so far plus distance left, so it heads for the target and still finds the cheapest path.",
    longDescription:
      "A* (pronounced “A star”) ranks each open cell by the cost to reach it plus an estimate of the cost left to the target. Here that estimate is the Manhattan distance, the steps left ignoring walls, which never overestimates. That's enough to guarantee the cheapest path while skipping most of the cells Dijkstra would look at behind the start. It's the standard choice for games and maps. Its running time depends on how good the estimate is; in the worst case it matches Dijkstra.",
    structure: "Priority queue, by cost so far + distance left",
    shortest: "cost",
    weighted: true,
    timeComplexity: "O((V + E) log V) worst case",
  },
  greedy: {
    title: "Greedy Best-First Search",
    short: "Greedy",
    shortDescription:
      "Always moves towards whichever cell looks closest to the target. Fast on open ground, easily fooled by walls and mud.",
    longDescription:
      "Greedy Best-First Search ranks open cells only by how far they look from the target, ignoring what it cost to get there. On open ground it runs almost straight at the target and looks at very few cells. But it has no memory of cost: it walks into dead ends that point the right way, wades through mud, and the path it returns can be far from the shortest. It's a useful contrast to A*, which adds the cost so far to the same estimate.",
    structure: "Priority queue, by distance left",
    shortest: "no",
    weighted: false,
    timeComplexity: "O((V + E) log V) worst case",
  },
};

/** Shortest-path guarantee and cost handling, in a few words. */
export const pathTraits = (algorithm: PathAlgorithm) => {
  const { shortest, weighted } = pathAlgorithms[algorithm];
  const guarantee = shortest === "cost" ? "Cheapest path" : shortest === "steps" ? "Fewest steps" : "Any path";
  return `${guarantee} · ${weighted ? "counts mud" : "ignores mud"}`;
};
