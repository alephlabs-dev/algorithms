import type { View } from "@/appStore";
import {
  decodeGraph,
  encodeGraph,
  graphAspect,
  GRAPH_ALGORITHMS,
  graphTimelineFor,
  makeGraph,
  type Graph,
  type GraphAlgorithm,
  type GraphPreset,
  type GraphSize,
  type GraphTimeline,
} from "@/graphs";
import { graphsLink, type GraphsLink } from "./graphs.link";
import { newSeed, seededRandom } from "@/utils/random";
import { GRAPH_STEP_WEIGHT } from "@/utils/speed";
import { defineModule, isNarrow, toggleRacer, type SliceContext } from "./slice";

export type GraphsState = {
  algorithm: GraphAlgorithm;
  /** How many nodes "new layout" makes, and of what kind. */
  size: GraphSize;
  preset: GraphPreset;
  graph: Graph;
  /** The whole run on the current graph, precomputed. */
  run: GraphTimeline;
  /** Algorithms racing on the graph, in the picker's order. */
  racers: GraphAlgorithm[];
  /** One run per racer, on the current graph. Empty outside race view. */
  raceRuns: GraphTimeline[];
  /** Bumped when the graph is replaced wholesale, so nodes don't glide between layouts. */
  inputId: number;
};

const DEFAULT_RACERS: GraphAlgorithm[] = ["bfs", "dfs", "prim", "kruskal"];

const raceRunsFor = (view: View, racers: GraphAlgorithm[], graph: Graph) =>
  view === "race" ? racers.map((a) => graphTimelineFor(a, graph)) : [];

/** Race lanes are a quarter of the stage: graphs there stay at a size that reads. */
const fitSize = (size: GraphSize, view: View, isMobile: boolean): GraphSize => {
  const cap: GraphSize = isMobile ? "small" : "medium";
  const order: GraphSize[] = ["small", "medium", "large"];
  return view === "race" && order.indexOf(size) > order.indexOf(cap) ? cap : size;
};

/** Every run on a graph, after it changes: the single run and the racers. */
const runsFor = (s: GraphsState, ctx: SliceContext, graph: Graph) => ({
  graph,
  run: graphTimelineFor(s.algorithm, graph),
  raceRuns: raceRunsFor(ctx.view, s.racers, graph),
});

/** A new layout of `preset` at `size` (fitted to the view), and its runs. */
const fresh = (s: GraphsState, ctx: SliceContext, preset: GraphPreset, requested: GraphSize) => {
  const size = fitSize(requested, ctx.view, ctx.isMobile);
  const graph = makeGraph(preset, size, isNarrow(ctx), seededRandom(newSeed()));
  return { preset, size, ...runsFor(s, ctx, graph), inputId: s.inputId + 1 };
};

export const graphsSlice = defineModule<GraphsState, GraphAlgorithm, GraphsLink>()({
  tourKey: "tour-done-graphs",

  readLink: graphsLink.read,
  hydrate: (link, ctx) => {
    const algorithm = link.algorithm ?? "bfs";
    const size = fitSize(link.params.size ?? "medium", ctx.view, ctx.isMobile);
    const preset = link.params.preset ?? "random";
    const graph =
      (link.params.graph && decodeGraph(link.params.graph)) ||
      makeGraph(preset, size, isNarrow(ctx), seededRandom(newSeed()));
    const racers = link.params.racers ?? DEFAULT_RACERS;
    return {
      algorithm,
      size,
      preset,
      graph,
      run: graphTimelineFor(algorithm, graph),
      racers,
      raceRuns: raceRunsFor(ctx.view, racers, graph),
      inputId: 0,
    };
  },

  current: (s) => s.algorithm,

  // The graph stays the same so algorithms can be compared on it.
  pick: (s, _, algorithm) => ({ algorithm, run: graphTimelineFor(algorithm, s.graph) }),

  actions: {
    setSize: (s, ctx, size: GraphSize) => fresh(s, ctx, s.preset, size),
    applyPreset: (s, ctx, preset: GraphPreset) => fresh(s, ctx, preset, s.size),
    /** Replaces the graph after an edit (moving a node, joining two); the run restarts. */
    edit: (s, ctx, graph: Graph) => runsFor(s, ctx, graph),
    toggleRacer: (s, ctx, racer: GraphAlgorithm) => {
      const racers = toggleRacer(GRAPH_ALGORITHMS, s.racers, racer);
      return racers && { racers, raceRuns: raceRunsFor(ctx.view, racers, s.graph) };
    },
  },

  // A big graph gets a fresh layout at the largest size a race shows well.
  forView: (s, ctx) => {
    const size = fitSize(s.size, ctx.view, ctx.isMobile);
    if (size === s.size) return { raceRuns: raceRunsFor(ctx.view, s.racers, s.graph) };
    return fresh(s, ctx, s.preset, size);
  },

  // Upright graphs for narrow screens, wide ones otherwise.
  fit: (s, ctx) => (s.graph.aspect === graphAspect(isNarrow(ctx)) ? null : fresh(s, ctx, s.preset, s.size)),

  newInput: (s, ctx) => fresh(s, ctx, s.preset, s.size),

  engine: {
    // Races tick one step per lane, so the clock runs until the longest run is over.
    lastIndex: (s, view) => (view === "race" ? Math.max(0, ...s.raceRuns.map((t) => t.length - 1)) : s.run.length - 1),
    stepWeight: (s, index) => GRAPH_STEP_WEIGHT[s.run.stepAt(index)?.type ?? "done"],
    pace: (view) => (view === "race" ? "graphRace" : "graphs"),
    search: (s, ctx) =>
      graphsLink.write(
        {
          graph: encodeGraph(s.graph),
          size: s.size,
          preset: s.preset,
          racers: s.racers,
        },
        ctx.speedPreset,
      ),
  },
});
