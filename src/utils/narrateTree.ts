import type { HashFrame, StructureRun, TreeFrame } from "@/structures";

const idle = (algorithm: StructureRun["algorithm"]) =>
  algorithm === "heap"
    ? "Press play to build the heap, or type a value below and insert or find it, or pop the minimum."
    : algorithm === "chaining" || algorithm === "probing"
      ? "Press play to fill the table, or type a value below and insert, find or delete it."
      : "Press play to build the tree, or type a value below and insert, find or delete it.";

const valueOf = (frame: TreeFrame, id: number) => frame.nodes.find((n) => n.id === id)?.value ?? "?";
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

const slotOf = (frame: TreeFrame, id: number) => frame.nodes.findIndex((n) => n.id === id);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The step into frame `index`, in one or two plain sentences. */
export const narrateTree = (run: StructureRun, index: number): string => {
  if (index === 0) return idle(run.algorithm);
  const frame = run.frames[index];
  if (frame.shape === "table") return narrateHash(run, frame);
  if (run.algorithm === "heap") return narrateHeap(run, frame);
  const before = run.frames[index - 1] as TreeFrame;
  const e = frame.event;
  switch (e.type) {
    case "start": {
      const verb = e.op.kind === "insert" ? "Insert" : e.op.kind === "search" ? "Search for" : "Delete";
      return frame.root === null && e.op.kind === "insert"
        ? `${verb} ${e.op.value}: the tree is empty, so it becomes the root.`
        : `${verb} ${e.op.value}: start at the root.`;
    }
    case "compare": {
      const at = valueOf(frame, e.node);
      if (e.go === "here") return `${e.value} = ${at}: this is it.`;
      return e.go === "left" ? `${e.value} < ${at}: go left.` : `${e.value} > ${at}: go right.`;
    }
    case "place":
      return e.parent === null
        ? `${valueOf(frame, e.node)} is the root.`
        : `Nothing there: ${valueOf(frame, e.node)} goes ${e.side} of ${valueOf(frame, e.parent)}.`;
    case "duplicate":
      return `${valueOf(frame, e.node)} is already in the tree: nothing to insert.`;
    case "found":
      return `Found ${valueOf(frame, e.node)}, after ${frame.path.length} ${frame.path.length === 1 ? "step" : "steps"} down.`;
    case "missing":
      return `Ran out of tree: ${e.value} isn't there.`;
    case "remove":
      if (e.children === 0) return `${e.value} has no children: just take it out.`;
      if (e.children === 1) return `${e.value} has one child, which takes its place.`;
      return `${e.value} has two children: find its successor, the smallest value on its right.`;
    case "successor":
      return `The successor is ${e.value}: copy it up, then remove the node it came from.`;
    case "removed":
      return e.child === null
        ? `${e.value} is gone.`
        : `${e.value} is gone; ${valueOf(frame, e.child)} took its place.`;
    case "height": {
      const node = frame.nodes.find((n) => n.id === e.node)!;
      return Math.abs(e.balance) > 1
        ? `Back up at ${node.value}: balance ${signed(e.balance)}, one side is two taller. Rotate.`
        : `Back up at ${node.value}: height ${node.height}, balance ${signed(e.balance)}. Still fine.`;
    }
    case "rotate": {
      const pivot = valueOf(frame, e.pivot);
      const up = valueOf(frame, e.up);
      const zigzag = before.event.type === "rotate";
      return `Rotate ${e.direction} at ${zigzag ? "the top" : pivot}: ${up} comes up, ${pivot} goes down to its ${e.direction}.`;
    }
    case "done": {
      const start = run.frames[run.opStarts[frame.opIndex]];
      const rotations = frame.stats.rotations - start.stats.rotations;
      if (rotations > 0)
        return `Balanced again, after ${rotations === 1 ? "one rotation" : `${rotations} rotations`}. ${Math.max(0, frame.height)} tall.`;
      return `Done. The tree has ${frame.nodes.length} ${frame.nodes.length === 1 ? "value" : "values"} and is ${Math.max(0, frame.height)} tall.`;
    }
    default:
      return "";
  }
};

const narrateHeap = (run: StructureRun, frame: TreeFrame): string => {
  const e = frame.event;
  const value = (id: number) => valueOf(frame, id);
  switch (e.type) {
    case "start":
      if (e.op.kind === "insert") return `Insert ${e.op.value}: it starts at the end, in the next free slot.`;
      if (e.op.kind === "search")
        return `Find ${e.op.value}: a heap has no left-or-right order to steer by, so check slot after slot.`;
      return frame.nodes[0]?.value === e.op.value
        ? `Pop the minimum, ${e.op.value}: it's always at the root, slot 0.`
        : `Delete ${e.op.value}: find it first.`;
    case "append": {
      if (e.index === 0) return `${value(e.node)} goes into slot 0: the root.`;
      const parent = frame.nodes[Math.floor((e.index - 1) / 2)];
      return `${value(e.node)} goes into slot ${e.index}, under ${parent.value} (slot ${Math.floor((e.index - 1) / 2)}).`;
    }
    case "sift": {
      const me = value(e.node);
      const other = value(e.other);
      if (e.direction === "up")
        return e.swap
          ? `${me} < ${other}, its parent: out of order. Swap up.`
          : `${me} ≥ ${other}, its parent: in order. It stays.`;
      return e.swap
        ? `${me} > ${other}, the smaller child: out of order. Swap down.`
        : `${me} ≤ ${other}, the smaller child: in order. It stays.`;
    }
    case "swap":
      return e.direction === "up"
        ? `${value(e.node)} moves up to slot ${slotOf(frame, e.node)}; ${value(e.other)} comes down.`
        : `${value(e.node)} moves down to slot ${slotOf(frame, e.node)}; ${value(e.other)} comes up.`;
    case "scan":
      return e.match
        ? `Slot ${e.index}: ${e.value}. Found it.`
        : `Slot ${e.index} holds ${value(e.node)}, not ${e.value}. Next slot.`;
    case "found":
      return `Found ${value(e.node)}, after checking ${plural(frame.path.length, "slot")}.`;
    case "missing":
      return `Checked every slot: ${e.value} isn't in the heap.`;
    case "take":
      return `Take ${e.value} out of slot ${slotOf(frame, e.node)}, leaving a hole.`;
    case "lift":
      return `The last value, ${e.value}, moves into the hole. Now it has to find its level.`;
    case "removed":
      return `${e.value} was in the last slot: just remove it.`;
    case "done": {
      const start = run.frames[run.opStarts[frame.opIndex]];
      const swaps = frame.stats.swaps - start.stats.swaps;
      if (!frame.nodes.length) return "Done. The heap is empty.";
      return `Done${swaps ? `, after ${plural(swaps, "swap")}` : ""}. The minimum, ${frame.nodes[0].value}, is at the root.`;
    }
    default:
      return "";
  }
};

const narrateHash = (run: StructureRun, frame: HashFrame): string => {
  const e = frame.event;
  const m = frame.buckets.length;
  const chaining = run.algorithm === "chaining";
  const unit = chaining ? "bucket" : "slot";
  const valueOfItem = (id: number) => frame.buckets.flat().find((i) => i.id === id)?.value ?? "?";
  switch (e.type) {
    case "start": {
      const verb = e.op.kind === "insert" ? "Insert" : e.op.kind === "search" ? "Find" : "Delete";
      return `${verb} ${e.op.value}: first, work out its ${unit}.`;
    }
    case "hash":
      return `${e.value} mod ${m} = ${e.bucket}: ${unit} ${e.bucket}. No searching to get there.`;
    case "probe":
      if (chaining)
        return e.match
          ? `${e.value} = ${e.value}: there it is.`
          : `${valueOfItem(e.item!)} ≠ ${e.value}: next in the bucket.`;
      if (e.item === null) return `Slot ${e.bucket} is empty: the walk stops here.`;
      if (e.deleted) return `Slot ${e.bucket} has a marker from a delete: keep going.`;
      if (e.match) return `Slot ${e.bucket} holds ${e.value}: there it is.`;
      return `Slot ${e.bucket} holds ${valueOfItem(e.item)}: taken. Try slot ${(e.bucket + 1) % m}.`;
    case "place":
      if (chaining) return `Not in the bucket: add ${valueOfItem(e.item)} to the end of bucket ${e.bucket}.`;
      return e.probes > 1
        ? `${valueOfItem(e.item)} goes in slot ${e.bucket}, ${plural(e.probes - 1, "slot")} past where it started.`
        : `${valueOfItem(e.item)} goes straight into slot ${e.bucket}.`;
    case "duplicate":
      return `${valueOfItem(e.item)} is already in the table: nothing to insert.`;
    case "found":
      return `Found ${valueOfItem(e.item)} in ${unit} ${e.bucket}.`;
    case "missing":
      return chaining
        ? `End of the bucket: ${e.value} isn't in the table.`
        : `${e.value} isn't in the table: had it been inserted, the walk would have reached it before an empty slot.`;
    case "removed":
      return e.marker
        ? `Leave a marker in slot ${e.bucket}: a find for a value further along mustn't stop here.`
        : `Unlink ${e.value} from bucket ${e.bucket}.`;
    case "full":
      return `Every slot is taken: there's no room for ${e.value}. Real tables grow before this happens.`;
    case "done": {
      const load = (frame.count / m).toFixed(2);
      return `Done. ${plural(frame.count, "value")} in ${m} ${unit}s: a load of ${load}.`;
    }
  }
};
