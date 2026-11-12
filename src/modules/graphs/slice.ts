import type { StageView } from "@/appStore";
import { decodeGraph, encodeGraph, graphAspect, makeGraph, type GraphPreset, type GraphSize } from "./graph";
import { GRAPH_ALGORITHMS, type Graph, type GraphAlgorithm, type GraphStep } from "./types";
import { graphTimelineFor } from "./run";
import type { GraphTimeline } from "./timeline";
import { graphsLink, type GraphsLink } from "./link";
import { newSeed, seededRandom } from "@/utils/random";
import { defineModule, isNarrow, toggleRacer, type SliceContext } from "@/modules/slice";
import { sentences } from "./sentences";

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

/**
 * Visiting a node gets the full beat, looking along an edge and
 * adding a node to the queue a shorter one.
 */
const STEP_WEIGHT: Record<GraphStep["type"], number> = {
  pop: 1,
  edge: 0.6,
  push: 0.6,
  back: 0.6,
  // Kruskal: looking at the next edge, then keeping or skipping it.
  sort: 1,
  consider: 0.6,
  join: 1,
  reject: 1,
  lower: 0.4,
  done: 1,
};

const DEFAULT_RACERS: GraphAlgorithm[] = ["bfs", "dfs", "prim", "kruskal"];

const raceRunsFor = (view: StageView, racers: GraphAlgorithm[], graph: Graph) =>
  view === "race" ? racers.map((a) => graphTimelineFor(a, graph)) : [];

/** Race lanes are a quarter of the stage: graphs there stay at a size that reads. */
const fitSize = (size: GraphSize, view: StageView, isMobile: boolean): GraphSize => {
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
  sentences,

  link: graphsLink,
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
    stepWeight: (s, index) => STEP_WEIGHT[s.run.stepAt(index)?.type ?? "done"],
    pace: () => 25,
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
