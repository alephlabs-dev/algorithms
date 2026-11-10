import type { NodeView, Operation, StructureRun, TreeEvent, TreeFrame } from "./types";

type Slot = { id: number; value: number };

// Pseudocode lines (see pseudocode.ts).
export const HEAP_LINE = {
  append: 0,
  siftUp: 1,
  scan: 2,
  scanMissing: 3,
  take: 4,
  lift: 5,
  siftDown: 6,
  swapDown: 7,
} as const;

const parentOf = (i: number) => Math.floor((i - 1) / 2);

/**
 * A min-heap kept in an array: slot i's children are slots 2i+1 and 2i+2,
 * and every parent is no bigger than its children, so the minimum is always
 * at slot 0. Records a frame for every comparison and swap. Values move
 * between slots with their ids, so a swap reads as two nodes trading places.
 *
 * Delete takes any value out (find it, fill its slot with the last value,
 * then sift); popping the minimum is deleting whatever is at the root.
 */
export class HeapRecorder implements StructureRun {
  readonly algorithm = "heap" as const;
  readonly frames: TreeFrame[] = [];
  readonly opStarts: number[] = [];
  private slots: Slot[] = [];
  private nextId = 0;
  private path: number[] = [];
  private opIndex = -1;
  private stats = { comparisons: 0, rotations: 0, swaps: 0 };

  constructor(operations: Operation[]) {
    this.snap({ type: "start", op: { kind: "insert", value: 0 } }, null, null);
    for (const op of operations) this.apply(op);
  }

  private frameOf(event: TreeEvent, focus: number | null, line: number | null): TreeFrame {
    const n = this.slots.length;
    // In array order, so the array view can draw them as they are stored.
    const nodes: NodeView[] = this.slots.map((s, i) => ({
      id: s.id,
      value: s.value,
      left: 2 * i + 1 < n ? this.slots[2 * i + 1].id : null,
      right: 2 * i + 2 < n ? this.slots[2 * i + 2].id : null,
      height: Math.floor(Math.log2(n - i)),
      balance: 0,
    }));
    return {
      shape: "tree",
      nodes,
      root: n ? this.slots[0].id : null,
      event,
      focus,
      path: this.path.slice(),
      line,
      opIndex: this.opIndex,
      stats: { ...this.stats },
      height: n ? Math.floor(Math.log2(n)) : -1,
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
      op.kind === "insert" ? HEAP_LINE.append : op.kind === "search" ? HEAP_LINE.scan : HEAP_LINE.take,
    );
    if (op.kind === "insert") this.insert(op.value);
    else if (op.kind === "search") this.find(op.value, HEAP_LINE.scan);
    else this.remove(op.value);
    this.path = [];
    this.snap({ type: "done", op }, null, null);
  }

  private swap(i: number, j: number, direction: "up" | "down", line: number) {
    [this.slots[i], this.slots[j]] = [this.slots[j], this.slots[i]];
    this.stats.swaps++;
    // After the swap the moving value sits in j.
    this.snap({ type: "swap", node: this.slots[j].id, other: this.slots[i].id, direction }, this.slots[j].id, line);
  }

  /** Moves slot i up while it's smaller than its parent. */
  private siftUp(i: number) {
    while (i > 0) {
      const p = parentOf(i);
      const me = this.slots[i];
      const parent = this.slots[p];
      this.stats.comparisons++;
      this.path.push(parent.id);
      const swap = me.value < parent.value;
      this.snap({ type: "sift", node: me.id, other: parent.id, swap, direction: "up" }, me.id, HEAP_LINE.siftUp);
      if (!swap) return;
      this.swap(i, p, "up", HEAP_LINE.siftUp);
      i = p;
    }
  }

  /** Moves slot i down while it's bigger than its smaller child. */
  private siftDown(i: number) {
    const n = this.slots.length;
    for (;;) {
      const l = 2 * i + 1;
      if (l >= n) return;
      const r = l + 1;
      const c = r < n && this.slots[r].value < this.slots[l].value ? r : l;
      const me = this.slots[i];
      const child = this.slots[c];
      this.stats.comparisons += r < n ? 2 : 1;
      this.path.push(child.id);
      const swap = child.value < me.value;
      this.snap({ type: "sift", node: me.id, other: child.id, swap, direction: "down" }, me.id, HEAP_LINE.siftDown);
      if (!swap) return;
      this.swap(i, c, "down", HEAP_LINE.swapDown);
      i = c;
    }
  }

  private insert(value: number) {
    const id = this.nextId++;
    this.slots.push({ id, value });
    this.path = [id];
    this.snap({ type: "append", node: id, index: this.slots.length - 1 }, id, HEAP_LINE.append);
    this.siftUp(this.slots.length - 1);
  }

  /** Checks slot after slot: a heap has no order to steer a search by. Returns the slot, or −1. */
  private find(value: number, line: number): number {
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      this.stats.comparisons++;
      this.path.push(slot.id);
      const match = slot.value === value;
      this.snap({ type: "scan", node: slot.id, value, index: i, match }, slot.id, line);
      if (match) {
        if (line === HEAP_LINE.scan) this.snap({ type: "found", node: slot.id }, slot.id, line);
        return i;
      }
    }
    this.snap({ type: "missing", value }, null, line === HEAP_LINE.scan ? HEAP_LINE.scanMissing : line);
    return -1;
  }

  private remove(value: number) {
    const i = this.find(value, HEAP_LINE.take);
    if (i < 0) return;
    const taken = this.slots[i];
    this.path = [];
    this.snap({ type: "take", node: taken.id, value }, taken.id, HEAP_LINE.take);
    const last = this.slots.pop()!;
    if (last.id === taken.id) {
      this.snap({ type: "removed", value, child: null }, null, HEAP_LINE.take);
      return;
    }
    this.slots[i] = last;
    this.path = [last.id];
    this.snap({ type: "lift", node: last.id, value: last.value }, last.id, HEAP_LINE.lift);
    // The last value may belong higher up (deleting from the middle) or, as usual, lower down.
    if (i > 0 && last.value < this.slots[parentOf(i)].value) this.siftUp(i);
    else this.siftDown(i);
  }
}
