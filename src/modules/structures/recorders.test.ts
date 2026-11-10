import { describe, expect, it } from "vitest";
import { seededRandom } from "@/utils/random";
import { decodeOperations, encodeOperations } from "./operations";
import { presetOperations } from "./presets";
import { HashRecorder, PROBING_SLOTS } from "./hash";
import { HeapRecorder } from "./heap";
import { TreeRecorder } from "./tree";
import type { HashFrame, NodeView, Operation, TreeFrame } from "./types";

const inOrder = (frame: TreeFrame) => {
  const byId = new Map(frame.nodes.map((n) => [n.id, n]));
  const out: number[] = [];
  const walk = (id: number | null) => {
    if (id === null) return;
    const n = byId.get(id)!;
    walk(n.left);
    out.push(n.value);
    walk(n.right);
  };
  walk(frame.root);
  return out;
};

const heightOf = (frame: TreeFrame) => {
  const byId = new Map(frame.nodes.map((n) => [n.id, n]));
  const h = (id: number | null): number =>
    id === null ? -1 : 1 + Math.max(h(byId.get(id)!.left), h(byId.get(id)!.right));
  return h(frame.root);
};

/** Random inserts, searches and deletes, with a plain set as the reference. */
const randomOps = (seed: number, count: number): Operation[] => {
  const random = seededRandom(seed);
  return Array.from({ length: count }, () => {
    const roll = random();
    return { kind: roll < 0.6 ? "insert" : roll < 0.8 ? "search" : "delete", value: 1 + Math.floor(random() * 40) };
  });
};

const reference = (ops: Operation[]) => {
  const set = new Set<number>();
  for (const op of ops) {
    if (op.kind === "insert") set.add(op.value);
    if (op.kind === "delete") set.delete(op.value);
  }
  return [...set].sort((a, b) => a - b);
};

describe("trees", () => {
  it("stay search trees holding exactly the values put in, after every operation", () => {
    for (const algorithm of ["bst", "avl"] as const) {
      for (let seed = 1; seed <= 20; seed++) {
        const ops = randomOps(seed, 60);
        const run = new TreeRecorder(algorithm, ops);
        run.opStarts.forEach((_, k) => {
          const end = run.frames[(run.opStarts[k + 1] ?? run.frames.length) - 1];
          expect(inOrder(end)).toEqual(reference(ops.slice(0, k + 1)));
        });
      }
    }
  });

  it("keeps an AVL tree balanced, with every height right, after every operation", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const run = new TreeRecorder("avl", randomOps(seed, 60));
      run.opStarts.forEach((_, k) => {
        const end = run.frames[(run.opStarts[k + 1] ?? run.frames.length) - 1];
        const byId = new Map(end.nodes.map((n) => [n.id, n]));
        const h = (id: number | null): number =>
          id === null ? -1 : 1 + Math.max(h(byId.get(id)!.left), h(byId.get(id)!.right));
        for (const n of end.nodes as NodeView[]) {
          expect(Math.abs(h(n.left) - h(n.right))).toBeLessThanOrEqual(1);
          expect(n.height).toBe(h(n.id));
        }
        expect(end.height).toBe(heightOf(end));
      });
    }
  });

  it("finds what's there and reports what isn't", () => {
    const run = new TreeRecorder("bst", [
      ...presetOperations("example", "medium", seededRandom(1)),
      { kind: "search", value: 45 },
      { kind: "search", value: 46 },
    ]);
    const events = run.frames.slice(run.opStarts[run.opStarts.length - 2]).map((f) => f.event.type);
    expect(events).toContain("found");
    expect(events).toContain("missing");
  });

  it("lets sorted input turn a plain BST into a list, while AVL stays short", () => {
    const ops = presetOperations("ascending", "large", seededRandom(1));
    const last = (r: TreeRecorder) => r.frames[r.frames.length - 1];
    const bst = last(new TreeRecorder("bst", ops));
    const avl = last(new TreeRecorder("avl", ops));
    expect(bst.height).toBe(ops.length - 1);
    expect(avl.height).toBeLessThanOrEqual(Math.floor(1.44 * Math.log2(ops.length + 2)));
    expect(avl.stats.rotations).toBeGreaterThan(0);
  });

  it("packs operations into a link and back", () => {
    const ops = randomOps(3, 25);
    expect(decodeOperations(encodeOperations(ops))).toEqual(ops);
    expect(decodeOperations("i5.x3")).toBeNull();
    expect(decodeOperations("i500")).toBeNull();
  });
});

describe("HeapRecorder", () => {
  const lastOf = (ops: Operation[]) => {
    const run = new HeapRecorder(ops);
    return run.frames[run.frames.length - 1] as TreeFrame;
  };

  it("keeps every parent no bigger than its children, with the same values as a reference", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const ops = randomOps(seed, 60);
      const reference: number[] = [];
      for (let k = 1; k <= ops.length; k++) {
        const op = ops[k - 1];
        if (op.kind === "insert") reference.push(op.value);
        if (op.kind === "delete") {
          const at = reference.indexOf(op.value);
          if (at >= 0) reference.splice(at, 1);
        }
        const values = lastOf(ops.slice(0, k)).nodes.map((n) => n.value);
        for (let i = 1; i < values.length; i++) expect(values[Math.floor((i - 1) / 2)]).toBeLessThanOrEqual(values[i]);
        expect([...values].sort((a, b) => a - b)).toEqual([...reference].sort((a, b) => a - b));
      }
    }
  });

  it("pops values in increasing order", () => {
    const values = [50, 30, 20, 70, 80, 75, 40, 35, 45, 10];
    const ops: Operation[] = values.map((value) => ({ kind: "insert", value }));
    const popped: number[] = [];
    for (let k = 0; k < values.length; k++) {
      const min = lastOf(ops).nodes[0].value;
      popped.push(min);
      ops.push({ kind: "delete", value: min });
    }
    expect(popped).toEqual([...values].sort((a, b) => a - b));
    expect(lastOf(ops).nodes).toHaveLength(0);
  });

  it("finds values by checking slot after slot", () => {
    const run = new HeapRecorder([
      { kind: "insert", value: 5 },
      { kind: "insert", value: 9 },
      { kind: "search", value: 9 },
      { kind: "search", value: 7 },
    ]);
    const events = run.frames.map((f) => f.event.type);
    expect(events).toContain("found");
    expect(events).toContain("missing");
  });
});

describe("HashRecorder", () => {
  const valuesOf = (run: HashRecorder) => {
    const frame = run.frames[run.frames.length - 1] as HashFrame;
    return frame.buckets.flatMap((b) => b.filter((i) => !i.deleted).map((i) => i.value)).sort((a, b) => a - b);
  };

  it.each(["chaining", "probing"] as const)("%s holds the same values as a set, and finds each one", (algorithm) => {
    for (let seed = 1; seed <= 20; seed++) {
      const ops = randomOps(seed, 60);
      const reference = new Set<number>();
      for (const op of ops) {
        // Linear probing has PROBING_SLOTS slots: once they all hold values, inserts are turned away.
        const full = algorithm === "probing" && reference.size >= PROBING_SLOTS;
        if (op.kind === "insert" && !full) reference.add(op.value);
        if (op.kind === "delete") reference.delete(op.value);
      }
      const run = new HashRecorder(algorithm, ops);
      expect(valuesOf(run)).toEqual([...reference].sort((a, b) => a - b));
      const searches = new HashRecorder(algorithm, [
        ...ops,
        ...[...reference].map((value) => ({ kind: "search" as const, value })),
      ]);
      const found = searches.frames.filter((f) => f.event.type === "found").length;
      const before = run.frames.filter((f) => f.event.type === "found").length;
      expect(found - before).toBe(reference.size);
    }
  });

  it("puts values in their bucket, value mod size", () => {
    const run = new HashRecorder(
      "chaining",
      [10, 17, 3].map((value) => ({ kind: "insert", value })),
    );
    const frame = run.frames[run.frames.length - 1] as HashFrame;
    expect(frame.buckets[3].map((i) => i.value)).toEqual([10, 17, 3]);
  });

  it("probing walks past a deleted value's marker", () => {
    // 1 and 24 both start at slot 1; deleting 1 must not hide 24.
    const run = new HashRecorder("probing", [
      { kind: "insert", value: 1 },
      { kind: "insert", value: 24 },
      { kind: "delete", value: 1 },
      { kind: "search", value: 24 },
    ]);
    expect(run.frames[run.frames.length - 2].event).toMatchObject({ type: "found", bucket: 2 });
  });
});
