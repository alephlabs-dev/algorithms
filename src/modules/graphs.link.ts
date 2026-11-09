import { graphPresets, graphSizes, type GraphPreset, type GraphSize } from "@/graphs/graph";
import { GRAPH_ALGORITHMS, type GraphAlgorithm } from "@/graphs/types";
import { isOneOf, isPacked, readRacers, speedParam, toQuery, type LinkCodec } from "./link";

/** A graph as a link carries it: the graph itself, plus the size and kind "new layout" makes. */
export type GraphsLink = {
  /** Nodes, edges and start, packed (see encodeGraph). Checked when the slice hydrates. */
  graph?: string;
  size?: GraphSize;
  preset?: GraphPreset;
  /** Who races on the graph, in the picker's order. */
  racers?: GraphAlgorithm[];
};

export const graphsLink: LinkCodec<GraphsLink> = {
  read: (params: URLSearchParams): GraphsLink => {
    const link: GraphsLink = {};
    const graph = params.get("graph");
    if (isPacked(graph)) link.graph = graph;
    const size = params.get("nodes");
    if (isOneOf(graphSizes, size)) link.size = size;
    const preset = params.get("layout");
    if (isOneOf(graphPresets, preset)) link.preset = preset;
    const racers = readRacers(params, GRAPH_ALGORITHMS);
    if (racers) link.racers = racers;
    return link;
  },
  write: (link, speed) =>
    toQuery({
      graph: link.graph,
      nodes: link.size,
      layout: link.preset,
      race: link.racers?.join(","),
      ...speedParam(speed),
    }),
};
