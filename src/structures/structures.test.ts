import { describe, expect, it } from "vitest";
import { seededRandom } from "@/utils/random";
import {
  decodeOperations,
  encodeOperations,
  presetOperations,
  TreeRecorder,
  type NodeView,
  type Operation,
  type TreeFrame,
} from ".";

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
