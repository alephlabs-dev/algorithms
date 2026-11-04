import { graphAlgorithms } from "@/consts/graphAlgorithms";
import { DONE, nodeName, otherEnd, type GraphAlgorithm, type GraphTimeline } from "@/graphs";

const IDLE =
  "Press play to start. Drag a node to move it, tap two nodes to join or split them, double-tap one to start there.";

const ending: Record<GraphAlgorithm, string> = {
  bfs: "the green edges reach each node in the fewest edges.",
  dfs: "the green edges are the tree the search made.",
  dijkstra: "the green edges are the cheapest route to each node.",
};

const distance = (value: number) => (Number.isFinite(value) ? String(value) : "∞");

/** The step into frame `index`, in one plain sentence. */
export const narrateGraph = (timeline: GraphTimeline, index: number, algorithm: GraphAlgorithm): string => {
  const step = timeline.stepAt(index);
  if (!step) return IDLE;
  const { graph, structure } = timeline;
  const before = timeline.frameAt(index - 1);
  const after = timeline.frameAt(index);
  const weighted = graphAlgorithms[algorithm].weighted;
  const where = structure === "queue" ? "the queue" : structure === "stack" ? "the stack" : "the open set";

  switch (step.type) {
    case "push": {
      const name = nodeName(step.node);
      if (step.edge === null) {
        return weighted ? `Start at ${name}, at distance 0.` : `Start at ${name}: add it to ${where}.`;
      }
      if (structure === "stack") return `${name} is new: go deeper, to ${name}.`;
      if (structure === "queue") return `${name} is new: add it to the back of the queue, at distance ${step.dist}.`;
      return Number.isFinite(before.dist[step.node])
        ? `A cheaper way to ${name}: ${step.dist} instead of ${before.dist[step.node]}.`
        : `${name} can now be reached at distance ${step.dist}: add it to the open set.`;
    }
    case "pop": {
      const name = nodeName(step.node);
      if (structure === "stack") return `Visit ${name}, number ${after.order[step.node] + 1}.`;
      if (structure === "queue") return `Take ${name} from the front of the queue (distance ${after.dist[step.node]}).`;
      return `${name} is the closest open node, at ${after.dist[step.node]}: that distance is final.`;
    }
    case "edge": {
      const edge = graph.edges[step.edge];
      const from = after.current!;
      const to = otherEnd(edge, from);
      const label = `${nodeName(from)}–${nodeName(to)}${weighted ? ` (weight ${edge.w})` : ""}`;
      const next = timeline.stepAt(index + 1);
      const leadsOn = next?.type === "push" && next.node === to;
      if (weighted) {
        if (before.states[to] === DONE) return `Look along ${label}: ${nodeName(to)} is already final.`;
        const through = before.dist[from] + edge.w;
        return leadsOn
          ? `Look along ${label}: through ${nodeName(from)}, ${nodeName(to)} costs ${before.dist[from]} + ${edge.w} = ${through}.`
          : `Look along ${label}: ${through} is no better than ${distance(before.dist[to])}. Keep it.`;
      }
      return leadsOn
        ? `Look along ${label}: ${nodeName(to)} hasn't been reached yet.`
        : `Look along ${label}: ${nodeName(to)} was already reached. Skip it.`;
    }
    case "back": {
      const back = after.current === null ? "" : `: back to ${nodeName(after.current)}`;
      return `${nodeName(step.node)} has no unvisited neighbours left${back}.`;
    }
    case "done":
      return `Done: every node reachable from ${nodeName(graph.start)} is visited, and ${ending[algorithm]}`;
  }
};
