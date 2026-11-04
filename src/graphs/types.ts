/**
 * Graphs: nodes joined by weighted edges. Like the other modules, each
 * algorithm is a generator that says what it does one step at a time; a
 * GraphTimeline records the steps so playback can go back and forth.
 */

export type GraphAlgorithm = "bfs" | "dfs" | "dijkstra";

/** A node's place, as a share of the layout's width and height (0–1). */
export type GraphNode = { x: number; y: number };

/** An undirected edge between nodes `a` and `b`, with a weight from 1 to 9. */
export type GraphEdge = { a: number; b: number; w: number };

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Width over height of the layout the nodes were placed in. */
  aspect: number;
  /** Where every algorithm starts. */
  start: number;
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
  | /** Every reachable node has been visited. */ { type: "done" }
);

export type GraphSearch = (graph: Graph) => Generator<GraphStep, void>;

/** What a node is, on screen. */
export const UNSEEN = 0;
/** Waiting in the queue, stack or priority queue (for depth-first search: on the stack, in progress). */
export const PENDING = 1;
export const DONE = 2;

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
  /** The node being visited, and the edge being looked at from it. */
  current: number | null;
  edge: number | null;
  line: number | null;
  done: boolean;
  stats: { visited: number; examined: number };
};
