/**
 * Data structures: you operate on them (insert, search, delete) and each
 * operation plays step by step. The run is every operation so far, recorded
 * frame by frame, so playback can go back and forth through all of it.
 */

export type StructureAlgorithm = "bst" | "avl";

export type OperationKind = "insert" | "search" | "delete";
export type Operation = { kind: OperationKind; value: number };

/** Values go from 1 to 99, so they fit in a node and a link. */
export const MIN_VALUE = 1;
export const MAX_VALUE = 99;
/** Enough to show the shapes trees take, few enough to read. */
export const MAX_NODES = 31;

/** A node as a frame shows it. `id` stays with the node through rotations, so it can glide to its new place. */
export type NodeView = {
  id: number;
  value: number;
  left: number | null;
  right: number | null;
  height: number;
  /** Height of the left subtree minus the right: AVL keeps it between −1 and 1. */
  balance: number;
};

/** What happened in a frame, for the stage to highlight and the narration to tell. */
export type TreeEvent =
  | { type: "start"; op: Operation }
  | { type: "compare"; node: number; value: number; go: "left" | "right" | "here" }
  | { type: "place"; node: number; parent: number | null; side: "left" | "right" | null }
  | { type: "duplicate"; node: number }
  | { type: "found"; node: number }
  | { type: "missing"; value: number }
  /** Deleting `node`, which has 0, 1 or 2 children. */
  | { type: "remove"; node: number; value: number; children: 0 | 1 | 2 }
  /** The node is gone; `child` (if any) took its place. */
  | { type: "removed"; value: number; child: number | null }
  /** Two children: `node` takes the value of its successor, the smallest node on its right. */
  | { type: "successor"; node: number; from: number; value: number }
  /** AVL, on the way back up: `node`'s height and balance, fixed. */
  | { type: "height"; node: number; balance: number }
  /** AVL: a rotation at `pivot`, which moves down; `up` takes its place. */
  | { type: "rotate"; direction: "left" | "right"; pivot: number; up: number }
  | { type: "done"; op: Operation };

export type TreeFrame = {
  nodes: NodeView[];
  root: number | null;
  event: TreeEvent;
  /** The node the step is about, if any. */
  focus: number | null;
  /** Nodes the current operation has passed through. */
  path: number[];
  line: number | null;
  /** Which operation this frame belongs to. */
  opIndex: number;
  stats: { comparisons: number; rotations: number };
  /** Edges on the longest way down from the root (−1 for an empty tree). */
  height: number;
};
