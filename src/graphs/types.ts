/**
 * Graphs: nodes joined by weighted edges. Like the other modules, each
 * algorithm is a generator that says what it does one step at a time; a
 * GraphTimeline records the steps so playback can go back and forth.
 */

/** Every graph algorithm, in the pickers' order. */
export const GRAPH_ALGORITHMS = ["bfs", "dfs", "dijkstra", "prim", "kruskal", "topo"] as const;
export type GraphAlgorithm = (typeof GRAPH_ALGORITHMS)[number];

/** A node's place, as a share of the layout's width and height (0–1). */
export type GraphNode = { x: number; y: number };

/** An edge between nodes `a` and `b` (from `a` to `b` in a directed graph), with a weight from 1 to 9. */
export type GraphEdge = { a: number; b: number; w: number };

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Width over height of the layout the nodes were placed in. */
  aspect: number;
  /** Where every algorithm starts. */
  start: number;
  /** Edges are one-way, from `a` to `b`. */
  directed?: boolean;
};

export const MAX_NODES = 26; // one letter each

export type GraphStep = {
  /** Pseudocode line (0-based) this step belongs to. */
  line?: number;
} & (
  | /** `node` joins the queue, stack or priority queue (or gets a better distance in it), reached by `edge`. */ {
      type: "push";
      node: number;
      edge: number | null;
      dist: number;
    }
  | /** `node` comes out of the structure and is visited. */ { type: "pop"; node: number }
  | /** The edge being looked at from the current node. */ { type: "edge"; edge: number }
  | /** Depth-first search is done with `node` and goes back to the node before it. */ { type: "back"; node: number }
  | /** Kruskal lines up every edge, lightest first. */ { type: "sort"; edges: number[] }
  | /** Kruskal takes the next lightest edge off the line. */ { type: "consider"; edge: number }
  | /** The edge joins two groups: it goes in the tree and the groups merge into `into`'s. */ {
      type: "join";
      edge: number;
      from: number;
      into: number;
    }
  | /** The edge's ends are already in one group: taking it would close a loop. */ { type: "reject"; edge: number }
  | /** Topological sort: `edge` into `node` is accounted for, one fewer edge left coming in. */ {
      type: "lower";
      node: number;
      edge: number;
    }
  | /** Every reachable node has been visited (or, for a topological sort, no more can be placed). */ { type: "done" }
);

export type GraphSearch = (graph: Graph) => Generator<GraphStep, void>;

/** What a node is, on screen. */
export const UNSEEN = 0;
/** Waiting in the queue, stack or priority queue (for depth-first search: on the stack, in progress). */
export const PENDING = 1;
export const DONE = 2;

/** What an edge is, on screen, besides being in a search's tree (see `parent`). */
export const EDGE_IDLE = 0;
/** Kept: in Kruskal's tree, or accounted for by a topological sort. */
export const EDGE_KEPT = 1;
/** Left out: it would have closed a loop. */
export const EDGE_REJECTED = 2;

export type GraphFrame = {
  /** UNSEEN, PENDING or DONE per node. */
  states: Uint8Array;
  /** Best known distance per node (steps for BFS, total weight for Dijkstra), or Infinity. */
  dist: Float64Array;
  /** When each node was visited (0 = first), or -1. */
  order: Int16Array;
  /** The edge each node was reached by, or -1: together they make the search's tree. */
  parent: Int16Array;
  /** The queue, stack or priority queue, front first. */
  pending: number[];
  /** EDGE_IDLE, EDGE_KEPT or EDGE_REJECTED per edge. */
  edgeStates: Uint8Array;
  /** Kruskal: the edges still to look at, lightest first. */
  edgeQueue: number[];
  /** Kruskal: the group each node is in, named by one of its nodes. */
  group: Int16Array;
  /** Topological sort: edges still coming into each node. */
  indegree: Int16Array;
  /** The node being visited, and the edge being looked at from it. */
  current: number | null;
  edge: number | null;
  line: number | null;
  done: boolean;
  stats: { visited: number; examined: number };
};
