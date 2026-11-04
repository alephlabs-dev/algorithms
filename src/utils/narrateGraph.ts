import { graphAlgorithms } from "@/consts/graphAlgorithms";
import {
  DONE,
  EDGE_KEPT,
  edgeName,
  nodeName,
  otherEnd,
  type GraphAlgorithm,
  type GraphFrame,
  type GraphTimeline,
} from "@/graphs";

const IDLE = "Press play to start. Drag nodes, tap two to join them, double-tap one to start there.";

const ending: Record<"bfs" | "dfs" | "dijkstra", string> = {
  bfs: "the green edges reach each node in the fewest edges.",
  dfs: "the green edges are the tree the search made.",
  dijkstra: "the green edges are the cheapest route to each node.",
};

const distance = (value: number) => (Number.isFinite(value) ? String(value) : "∞");
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Total weight of a spanning tree as the frame has it: Prim's tree edges, or Kruskal's kept ones. */
const treeWeight = (timeline: GraphTimeline, frame: GraphFrame) => {
  const edges = timeline.graph.edges;
  if (timeline.structure === "edges") {
    return edges.reduce((sum, e, k) => sum + (frame.edgeStates[k] === EDGE_KEPT ? e.w : 0), 0);
  }
  return [...frame.parent].reduce((sum, e) => sum + (e >= 0 ? edges[e].w : 0), 0);
};

/** The step into frame `index`, in one plain sentence. */
export const narrateGraph = (timeline: GraphTimeline, index: number, algorithm: GraphAlgorithm): string => {
  const step = timeline.stepAt(index);
  if (!step) return IDLE;
  const { graph, structure } = timeline;
  const before = timeline.frameAt(index - 1);
  const after = timeline.frameAt(index);
  const { weighted } = graphAlgorithms[algorithm];
  const next = timeline.stepAt(index + 1);

  switch (step.type) {
    case "push": {
      const name = nodeName(step.node);
      if (algorithm === "topo") {
        return step.edge === null && before.stats.visited === 0
          ? `${name} has nothing coming in: it's ready.`
          : `Nothing else comes into ${name}: it's ready.`;
      }
      if (algorithm === "prim") {
        if (step.edge === null) return `Start the tree at ${name}.`;
        return Number.isFinite(before.dist[step.node])
          ? `A cheaper way to bring in ${name}: weight ${step.dist} instead of ${before.dist[step.node]}.`
          : `${name} could join through ${edgeName(graph, step.edge)}, weight ${step.dist}.`;
      }
      if (step.edge === null) {
        return weighted ? `Start at ${name}, at distance 0.` : `Start at ${name}: add it to the ${structure}.`;
      }
      if (structure === "stack") return `${name} is new: go deeper, to ${name}.`;
      if (structure === "queue") return `${name} is new: add it to the back of the queue, at distance ${step.dist}.`;
      return Number.isFinite(before.dist[step.node])
        ? `A cheaper way to ${name}: ${step.dist} instead of ${before.dist[step.node]}.`
        : `${name} can now be reached at distance ${step.dist}: add it to the open set.`;
    }
    case "pop": {
      const name = nodeName(step.node);
      if (algorithm === "topo") return `Place ${name}, number ${after.order[step.node] + 1} in the order.`;
      if (algorithm === "prim") {
        return step.node === graph.start
          ? `${name} is the tree's first node.`
          : `${name} has the cheapest way in, weight ${after.dist[step.node]}: it joins the tree.`;
      }
      if (structure === "stack") return `Visit ${name}, number ${after.order[step.node] + 1}.`;
      if (structure === "queue") return `Take ${name} from the front of the queue (distance ${after.dist[step.node]}).`;
      return `${name} is the closest open node, at ${after.dist[step.node]}: that distance is final.`;
    }
    case "edge": {
      const edge = graph.edges[step.edge];
      const from = after.current!;
      const to = otherEnd(edge, from);
      const label = `${edgeName(graph, step.edge)}${weighted ? ` (weight ${edge.w})` : ""}`;
      const leadsOn = next?.type === "push" && next.node === to;
      if (algorithm === "topo") return `Cross out ${nodeName(from)}→${nodeName(to)}: it's accounted for now.`;
      if (algorithm === "prim") {
        if (before.states[to] === DONE) return `Look along ${label}: ${nodeName(to)} is already in the tree.`;
        return leadsOn
          ? `Look along ${label}: cheaper than any way in ${nodeName(to)} had (${distance(before.dist[to])}).`
          : `Look along ${label}: ${nodeName(to)} already has a way in as cheap, ${distance(before.dist[to])}.`;
      }
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
    case "lower": {
      const left = after.indegree[step.node];
      return left === 0
        ? `${nodeName(step.node)} has no edges left coming in.`
        : `${nodeName(step.node)} still has ${plural(left, "edge")} coming in.`;
    }
    case "back": {
      const back = after.current === null ? "" : `: back to ${nodeName(after.current)}`;
      return `${nodeName(step.node)} has no unvisited neighbours left${back}.`;
    }
    case "sort":
      return `Line up all ${plural(step.edges.length, "edge")}, lightest first. Every node starts in a group of its own.`;
    case "consider":
      return `Next lightest: ${edgeName(graph, step.edge)}, weight ${graph.edges[step.edge].w}.`;
    case "join":
      return `${edgeName(graph, step.edge)} joins two groups: keep it, and group ${nodeName(step.from)} merges into group ${nodeName(step.into)}.`;
    case "reject": {
      const { a, b } = graph.edges[step.edge];
      return `${nodeName(a)} and ${nodeName(b)} are already in one group: ${edgeName(graph, step.edge)} would close a loop. Skip it.`;
    }
    case "done": {
      if (algorithm === "topo") {
        const left = after.states.filter((s) => s !== DONE).length;
        return left === 0
          ? "Done: every node is placed after everything that points to it."
          : `Stuck: ${plural(left, "node")} still have edges coming in, so the graph has a loop and no order exists.`;
      }
      if (algorithm === "prim" || algorithm === "kruskal") {
        return `Done: the green edges join the nodes with the smallest possible total weight, ${treeWeight(timeline, after)}.`;
      }
      return `Done: every node reachable from ${nodeName(graph.start)} is visited, and ${ending[algorithm]}`;
    }
  }
};
