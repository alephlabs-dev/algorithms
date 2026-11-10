import { graphSearches } from "./searches";
import { GraphTimeline, type Structure } from "./timeline";
import type { Graph, GraphAlgorithm } from "./types";

/** What each algorithm keeps its nodes in. */
export const graphStructure: Record<GraphAlgorithm, Structure> = {
  bfs: "queue",
  dfs: "stack",
  dijkstra: "priority",
  prim: "priority",
  kruskal: "edges",
  topo: "ready",
};

export const graphTimelineFor = (algorithm: GraphAlgorithm, graph: Graph) =>
  new GraphTimeline(graphSearches[algorithm], graph, graphStructure[algorithm]);
