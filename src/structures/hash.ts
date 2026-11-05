import type { HashEvent, HashFrame, HashItem, Operation, StructureRun } from "./types";

// Pseudocode lines (see pseudocode.ts); the same for both kinds of table.
export const HASH_LINE = {
  insertHash: 0,
  insertWalk: 1,
  insertPlace: 2,
  findHash: 3,
  findWalk: 4,
  findMissing: 5,
  deleteHash: 6,
  deleteWalk: 7,
  deleteUnlink: 8,
} as const;

/** Buckets: few enough to read as rows; chains grow to a handful. */
export const CHAINING_BUCKETS = 7;
/** Slots: room for the largest preset with some to spare, so clusters show without filling up. */
export const PROBING_SLOTS = 23;

/**
 * A hash table, h(v) = v mod m. Chaining keeps a list per bucket; linear
 * probing keeps one value per slot and, on a collision, tries the next slot
 * along. A delete in linear probing leaves a marker, so a later search knows
 * to keep going past it. Records a frame for every slot or link looked at.
 */
export class HashRecorder implements StructureRun {
  readonly frames: HashFrame[] = [];
  readonly opStarts: number[] = [];
  readonly size: number;
  private buckets: HashItem[][];
  private nextId = 0;
  private probed: number[] = [];
  private opIndex = -1;
  private stats = { comparisons: 0, rotations: 0, swaps: 0 };

  constructor(
    readonly algorithm: "chaining" | "probing",
    operations: Operation[],
  ) {
    this.size = algorithm === "chaining" ? CHAINING_BUCKETS : PROBING_SLOTS;
    this.buckets = Array.from({ length: this.size }, () => []);
    this.snap({ type: "start", op: { kind: "insert", value: 0 } }, null, null);
    for (const op of operations) this.apply(op);
  }

  private get probing() {
    return this.algorithm === "probing";
  }

  private snap(event: HashEvent, focus: HashFrame["focus"], line: number | null) {
    this.frames.push({
      shape: "table",
      buckets: this.buckets.map((b) => b.map((item) => ({ ...item }))),
      event,
      focus,
      probed: this.probed.slice(),
      line,
      opIndex: this.opIndex,
      stats: { ...this.stats },
      count: this.buckets.reduce((sum, b) => sum + b.filter((i) => !i.deleted).length, 0),
    });
  }

  private apply(op: Operation) {
    this.opIndex++;
    this.opStarts.push(this.frames.length);
    this.probed = [];
    const hashLine =
      op.kind === "insert" ? HASH_LINE.insertHash : op.kind === "search" ? HASH_LINE.findHash : HASH_LINE.deleteHash;
    this.snap({ type: "start", op }, null, hashLine);
    const bucket = op.value % this.size;
    this.probed = [bucket];
    this.snap({ type: "hash", value: op.value, bucket }, { bucket, item: null }, hashLine);
    if (op.kind === "insert") this.insert(op.value, bucket);
    else if (op.kind === "search") this.search(op.value, bucket);
    else this.remove(op.value, bucket);
    this.probed = [];
    this.snap({ type: "done", op }, null, null);
  }

  /**
   * Looks for `value` from its bucket on. Chaining walks the bucket's chain;
   * linear probing walks slots until an empty one. Returns where it is, if
   * found, and (probing) the first slot a new value could go in.
   */
  private locate(value: number, bucket: number, line: number) {
    let free: number | null = null;
    if (!this.probing) {
      for (const item of this.buckets[bucket]) {
        this.stats.comparisons++;
        const match = item.value === value;
        this.snap(
          { type: "probe", bucket, item: item.id, value, match, deleted: false },
          { bucket, item: item.id },
          line,
        );
        if (match) return { bucket, item, free };
      }
      return { bucket: null, item: null, free: bucket };
    }
    for (let k = 0; k < this.size; k++) {
      const slot = (bucket + k) % this.size;
      if (k > 0) this.probed.push(slot);
      const item = this.buckets[slot][0] ?? null;
      this.stats.comparisons++;
      const match = item !== null && !item.deleted && item.value === value;
      this.snap(
        { type: "probe", bucket: slot, item: item?.id ?? null, value, match, deleted: !!item?.deleted },
        { bucket: slot, item: item?.id ?? null },
        line,
      );
      if (item === null) return { bucket: null, item: null, free: free ?? slot };
      if (item.deleted) free ??= slot;
      else if (match) return { bucket: slot, item, free };
    }
    return { bucket: null, item: null, free };
  }

  private insert(value: number, bucket: number) {
    const at = this.locate(value, bucket, HASH_LINE.insertWalk);
    if (at.item) {
      this.snap(
        { type: "duplicate", bucket: at.bucket!, item: at.item.id },
        { bucket: at.bucket!, item: at.item.id },
        HASH_LINE.insertWalk,
      );
      return;
    }
    if (at.free === null) {
      this.snap({ type: "full", value }, null, HASH_LINE.insertWalk);
      return;
    }
    const item = { id: this.nextId++, value };
    if (this.probing) this.buckets[at.free] = [item];
    else this.buckets[at.free].push(item);
    this.snap(
      { type: "place", bucket: at.free, item: item.id, probes: this.probed.length },
      { bucket: at.free, item: item.id },
      HASH_LINE.insertPlace,
    );
  }

  private search(value: number, bucket: number) {
    const at = this.locate(value, bucket, HASH_LINE.findWalk);
    if (at.item)
      this.snap(
        { type: "found", bucket: at.bucket!, item: at.item.id },
        { bucket: at.bucket!, item: at.item.id },
        HASH_LINE.findWalk,
      );
    else this.snap({ type: "missing", value }, null, HASH_LINE.findMissing);
  }

  private remove(value: number, bucket: number) {
    const at = this.locate(value, bucket, HASH_LINE.deleteWalk);
    if (!at.item) {
      this.snap({ type: "missing", value }, null, HASH_LINE.deleteWalk);
      return;
    }
    const b = at.bucket!;
    if (this.probing) this.buckets[b] = [{ ...at.item, deleted: true }];
    else this.buckets[b] = this.buckets[b].filter((i) => i.id !== at.item.id);
    this.snap(
      { type: "removed", value, bucket: b, marker: this.probing },
      { bucket: b, item: this.probing ? at.item.id : null },
      HASH_LINE.deleteUnlink,
    );
  }
}
