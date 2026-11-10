import type { NodeView, Operation, StructureRun, TreeAlgorithm, TreeEvent, TreeFrame } from "./types";

type Node = { id: number; value: number; left: number | null; right: number | null; height: number };

// Pseudocode lines (see pseudocode.ts), so frames can light the one they're on.
export const LINE = {
  insertStart: 0,
  insertCompare: 1,
  insertPlace: 2,
  searchCompare: 4,
  searchMissing: 5,
  deleteFind: 7,
  deleteSimple: 8,
  deleteTwo: 9,
  avlHeight: 11,
  avlRotate: 12,
} as const;

/**
 * Applies operations to a binary search tree, AVL or not, and records a
 * frame for every step: each comparison, where a node lands, what a delete
 * does, and (AVL) every height fixed and rotation made on the way back up.
 */
export class TreeRecorder implements StructureRun {
  readonly frames: TreeFrame[] = [];
  /** The frame each operation starts at. */
  readonly opStarts: number[] = [];
  private nodes = new Map<number, Node>();
  private root: number | null = null;
  private nextId = 0;
  private path: number[] = [];
  private opIndex = -1;
  private stats = { comparisons: 0, rotations: 0, swaps: 0 };

  constructor(
    readonly algorithm: TreeAlgorithm,
    operations: Operation[],
  ) {
    // Frame 0: the empty tree, before anything happens.
    this.snap({ type: "start", op: { kind: "insert", value: 0 } }, null, null);
    for (const op of operations) this.apply(op);
  }

  private get avl() {
    return this.algorithm === "avl";
  }

  private height = (id: number | null) => (id === null ? -1 : this.nodes.get(id)!.height);
  private balanceOf = (id: number) => {
    const n = this.nodes.get(id)!;
    return this.height(n.left) - this.height(n.right);
  };
  private fix = (id: number) => {
    const n = this.nodes.get(id)!;
    n.height = 1 + Math.max(this.height(n.left), this.height(n.right));
  };

  private frameOf(event: TreeEvent, focus: number | null, line: number | null): TreeFrame {
    const nodes: NodeView[] = [...this.nodes.values()].map((n) => ({ ...n, balance: this.balanceOf(n.id) }));
    return {
      shape: "tree",
      nodes,
      root: this.root,
      event,
      focus,
      path: this.path.slice(),
      line,
      opIndex: this.opIndex,
      stats: { ...this.stats },
      height: this.height(this.root),
    };
  }

  private snap(event: TreeEvent, focus: number | null, line: number | null) {
    this.frames.push(this.frameOf(event, focus, line));
  }

  private apply(op: Operation) {
    this.opIndex++;
    this.opStarts.push(this.frames.length);
    this.path = [];
    this.snap(
      { type: "start", op },
      null,
      op.kind === "insert" ? LINE.insertStart : op.kind === "search" ? LINE.searchCompare : LINE.deleteFind,
    );
    if (op.kind === "insert") this.insert(op.value);
    else if (op.kind === "search") this.search(op.value);
    else this.remove(op.value);
    this.path = [];
    this.snap({ type: "done", op }, null, null);
  }

  /** Walks down from the root towards `value`; returns the node holding it, or the last node passed. */
  private descend(value: number, line: number): { found: number | null; last: number | null } {
    let at = this.root;
    let last: number | null = null;
    while (at !== null) {
      const node = this.nodes.get(at)!;
      this.path.push(at);
      this.stats.comparisons++;
      const go = value < node.value ? "left" : value > node.value ? "right" : "here";
      this.snap({ type: "compare", node: at, value, go }, at, line);
      if (go === "here") return { found: at, last: at };
      last = at;
      at = go === "left" ? node.left : node.right;
    }
    return { found: null, last };
  }

  private insert(value: number) {
    const { found, last } = this.descend(value, LINE.insertCompare);
    if (found !== null) {
      this.snap({ type: "duplicate", node: found }, found, LINE.insertCompare);
      return;
    }
    const id = this.nextId++;
    this.nodes.set(id, { id, value, left: null, right: null, height: 0 });
    let side: "left" | "right" | null = null;
    if (last === null) this.root = id;
    else {
      const parent = this.nodes.get(last)!;
      side = value < parent.value ? "left" : "right";
      parent[side] = id;
    }
    this.snap({ type: "place", node: id, parent: last, side }, id, LINE.insertPlace);
    if (this.avl) this.rebalance(this.path.slice(), true);
    else for (const at of this.path.slice().reverse()) this.fix(at);
  }

  private search(value: number) {
    const { found } = this.descend(value, LINE.searchCompare);
    if (found !== null) this.snap({ type: "found", node: found }, found, LINE.searchCompare);
    else this.snap({ type: "missing", value }, null, LINE.searchMissing);
  }

  /** Points `parent`'s link to `old` (or the root, if `parent` is null) at `next` instead. */
  private relink(parent: number | null, old: number, next: number | null) {
    if (parent === null) this.root = next;
    else {
      const p = this.nodes.get(parent)!;
      if (p.left === old) p.left = next;
      else p.right = next;
    }
  }

  private remove(value: number) {
    const { found } = this.descend(value, LINE.deleteFind);
    if (found === null) {
      this.snap({ type: "missing", value }, null, LINE.deleteFind);
      return;
    }
    const node = this.nodes.get(found)!;
    const children = ((node.left !== null ? 1 : 0) + (node.right !== null ? 1 : 0)) as 0 | 1 | 2;
    this.snap(
      { type: "remove", node: found, value, children },
      found,
      children === 2 ? LINE.deleteTwo : LINE.deleteSimple,
    );
    let target = found;
    if (children === 2) {
      // The successor: one step right, then left as far as it goes. It has no left child.
      let at = node.right!;
      this.path.push(at);
      while (this.nodes.get(at)!.left !== null) {
        at = this.nodes.get(at)!.left!;
        this.path.push(at);
      }
      const successor = this.nodes.get(at)!;
      node.value = successor.value;
      this.snap({ type: "successor", node: found, from: at, value: successor.value }, found, LINE.deleteTwo);
      target = at;
    }
    // `target` has at most one child, which takes its place.
    const t = this.nodes.get(target)!;
    const child = t.left ?? t.right;
    this.path.pop(); // target itself
    const parent = this.path.length ? this.path[this.path.length - 1] : null;
    this.relink(parent, target, child);
    this.nodes.delete(target);
    this.snap({ type: "removed", value, child }, child ?? parent, LINE.deleteSimple);
    if (this.avl) this.rebalance(this.path.slice(), false);
    else for (const at of this.path.slice().reverse()) this.fix(at);
  }

  /**
   * AVL, on the way back up `path` (root first): fix each height, and rotate
   * where a side got two taller. After an insert one fix is enough and the
   * walk stops once a height doesn't change; after a delete it goes all the way.
   */
  private rebalance(path: number[], afterInsert: boolean) {
    for (let k = path.length - 1; k >= 0; k--) {
      const id = path[k];
      const before = this.height(id);
      this.fix(id);
      const balance = this.balanceOf(id);
      this.snap({ type: "height", node: id, balance }, id, LINE.avlHeight);
      let top = id;
      if (balance > 1) {
        const left = this.nodes.get(id)!.left!;
        if (this.balanceOf(left) < 0) this.rotate(left, "left", id);
        top = this.rotate(id, "right", k > 0 ? path[k - 1] : null);
      } else if (balance < -1) {
        const right = this.nodes.get(id)!.right!;
        if (this.balanceOf(right) > 0) this.rotate(right, "right", id);
        top = this.rotate(id, "left", k > 0 ? path[k - 1] : null);
      }
      if (afterInsert && this.height(top) === before && top === id) break;
      if (afterInsert && top !== id) break;
    }
  }

  /** Rotates at `pivot`: its child on the other side comes up and `pivot` goes down. Returns the new top. */
  private rotate(pivot: number, direction: "left" | "right", parent: number | null) {
    const p = this.nodes.get(pivot)!;
    const up = direction === "right" ? p.left! : p.right!;
    const u = this.nodes.get(up)!;
    if (direction === "right") {
      p.left = u.right;
      u.right = pivot;
    } else {
      p.right = u.left;
      u.left = pivot;
    }
    this.relink(parent, pivot, up);
    this.fix(pivot);
    this.fix(up);
    this.stats.rotations++;
    this.snap({ type: "rotate", direction, pivot, up }, up, LINE.avlRotate);
    return up;
  }
}
