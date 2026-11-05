/**
 * Data structures: you operate on them (insert, search, delete) and each
 * operation plays step by step. The run is every operation so far, recorded
 * frame by frame, so playback can go back and forth through all of it.
 */

export type StructureAlgorithm = "bst" | "avl" | "heap" | "chaining" | "probing";
/** The two search trees: the ones that race. */
export type TreeAlgorithm = "bst" | "avl";
export const isHashTable = (a: StructureAlgorithm): a is "chaining" | "probing" => a === "chaining" || a === "probing";

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
  /** Heap: `node` was added at the end of the array, at `index`. */
  | { type: "append"; node: number; index: number }
  /** Heap: `node` compared with its parent (up) or its smaller child (down); `swap` if they're out of order. */
  | { type: "sift"; node: number; other: number; swap: boolean; direction: "up" | "down" }
  /** Heap: `node` and `other` traded places. */
  | { type: "swap"; node: number; other: number; direction: "up" | "down" }
  /** Heap: checking slot `index` while looking for `value`. */
  | { type: "scan"; node: number; value: number; index: number; match: boolean }
  /** Heap: taking `value` out of `node`'s slot. */
  | { type: "take"; node: number; value: number }
  /** Heap: the last value, `node`, moved into the hole. */
  | { type: "lift"; node: number; value: number }
  | { type: "done"; op: Operation };

export type TreeFrame = {
  shape: "tree";
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
  stats: StructureStats;
  /** Edges on the longest way down from the root (−1 for an empty tree). */
  height: number;
};

export type StructureStats = { comparisons: number; rotations: number; swaps: number };

/** A value in a hash table. A deleted one, in linear probing, stays behind as a marker. */
export type HashItem = { id: number; value: number; deleted?: boolean };

export type HashEvent =
  | { type: "start"; op: Operation }
  /** `value` mod the table size: the bucket it belongs in. */
  | { type: "hash"; value: number; bucket: number }
  /** Looking at `item` (null: an empty slot) in `bucket`; `match` if it holds `value`. */
  | { type: "probe"; bucket: number; item: number | null; value: number; match: boolean; deleted: boolean }
  | { type: "place"; bucket: number; item: number; probes: number }
  | { type: "duplicate"; bucket: number; item: number }
  | { type: "found"; bucket: number; item: number }
  | { type: "missing"; value: number }
  /** Gone from `bucket`; in linear probing a marker stays in its slot. */
  | { type: "removed"; value: number; bucket: number; marker: boolean }
  /** Linear probing: every slot is taken. */
  | { type: "full"; value: number }
  | { type: "done"; op: Operation };

export type HashFrame = {
  shape: "table";
  /** Chaining: each bucket's chain. Linear probing: each slot holds at most one item. */
  buckets: HashItem[][];
  event: HashEvent;
  /** The bucket and item the step is about. */
  focus: { bucket: number; item: number | null } | null;
  /** Buckets the current operation has looked in. */
  probed: number[];
  line: number | null;
  opIndex: number;
  stats: StructureStats;
  /** Values in the table (markers don't count). */
  count: number;
};

export type StructureFrame = TreeFrame | HashFrame;

/** Every frame of every operation so far, for any structure. */
export type StructureRun = {
  readonly algorithm: StructureAlgorithm;
  readonly frames: StructureFrame[];
  /** The frame each operation starts at. */
  readonly opStarts: number[];
};

/** The values a frame holds, in no particular order. */
export const valuesIn = (frame: StructureFrame): number[] =>
  frame.shape === "tree"
    ? frame.nodes.map((n) => n.value)
    : frame.buckets.flatMap((b) => b.filter((i) => !i.deleted).map((i) => i.value));
