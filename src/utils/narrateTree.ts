import type { TreeFrame, TreeRecorder } from "@/structures";

const IDLE = "Press play to build the tree, or type a value below and insert, find or delete it.";

const valueOf = (frame: TreeFrame, id: number) => frame.nodes.find((n) => n.id === id)?.value ?? "?";
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

/** The step into frame `index`, in one or two plain sentences. */
export const narrateTree = (run: TreeRecorder, index: number): string => {
  if (index === 0) return IDLE;
  const frame = run.frames[index];
  const before = run.frames[index - 1];
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
  }
};
