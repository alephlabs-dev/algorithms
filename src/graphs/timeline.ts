import { DONE, PENDING, type Graph, type GraphFrame, type GraphSearch, type GraphStep } from "./types";

/** How a search keeps the nodes it still has to visit. */
export type Structure = "queue" | "stack" | "priority";

const copy = (f: GraphFrame): GraphFrame => ({
  ...f,
  states: f.states.slice(),
  dist: f.dist.slice(),
  order: f.order.slice(),
  parent: f.parent.slice(),
  pending: f.pending.slice(),
  stats: { ...f.stats },
});

/**
 * A whole search, recorded up front: frame i is the graph after i steps.
 * Graphs are small (a run is a few hundred steps at most), so every frame is kept.
 */
export class GraphTimeline {
  readonly length: number;
  private readonly steps: GraphStep[] = [];
  private readonly frames: GraphFrame[] = [];

  constructor(
    search: GraphSearch,
    readonly graph: Graph,
    readonly structure: Structure,
  ) {
    const n = graph.nodes.length;
    let frame: GraphFrame = {
      states: new Uint8Array(n),
      dist: new Float64Array(n).fill(Infinity),
      order: new Int16Array(n).fill(-1),
      parent: new Int16Array(n).fill(-1),
      pending: [],
      current: null,
      edge: null,
      line: null,
      done: false,
      stats: { visited: 0, examined: 0 },
    };
    this.frames.push(frame);
    for (const step of search(graph)) {
      frame = copy(frame);
      this.apply(frame, step);
      this.steps.push(step);
      this.frames.push(frame);
    }
    this.length = this.frames.length;
  }

  private apply(f: GraphFrame, step: GraphStep) {
    if (step.line !== undefined) f.line = step.line;
    switch (step.type) {
      case "push":
        f.dist[step.node] = step.dist;
        f.parent[step.node] = step.edge ?? -1;
        f.states[step.node] = PENDING;
        if (!f.pending.includes(step.node)) f.pending.push(step.node);
        // A priority queue reads best first.
        if (this.structure === "priority") f.pending.sort((p, q) => f.dist[p] - f.dist[q] || p - q);
        f.edge = null;
        break;
      case "pop":
        f.current = step.node;
        f.edge = null;
        f.order[step.node] = f.stats.visited++;
        // A stack keeps a node until it's done with it; a queue lets it go as soon as it's taken.
        if (this.structure !== "stack") {
          f.pending = f.pending.filter((node) => node !== step.node);
          f.states[step.node] = DONE;
        }
        break;
      case "edge":
        f.edge = step.edge;
        f.stats.examined++;
        break;
      case "back":
        f.states[step.node] = DONE;
        f.pending = f.pending.filter((node) => node !== step.node);
        f.current = f.pending.length ? f.pending[f.pending.length - 1] : null;
        f.edge = null;
        break;
      case "done":
        f.done = true;
        f.current = null;
        f.edge = null;
        break;
    }
  }

  frameAt(index: number): GraphFrame {
    return this.frames[Math.min(Math.max(index, 0), this.length - 1)];
  }

  /** The step that leads from frame `index - 1` to frame `index`. */
  stepAt(index: number): GraphStep | null {
    return index > 0 && index < this.length ? this.steps[index - 1] : null;
  }
}
