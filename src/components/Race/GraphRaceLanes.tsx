import { useShallow } from "zustand/react/shallow";
import { graphAlgorithms } from "@/consts/graphAlgorithms";
import { DONE, EDGE_KEPT, type GraphAlgorithm, type GraphFrame, type GraphTimeline } from "@/graphs";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { ordinal } from "@/utils/ordinal";
import { GraphCanvas } from "../Graphs/GraphStage";
import { PlaceBadge, ResultsOverlay } from "./RaceParts";

const format = (n: number) => n.toLocaleString("en-US");

/** The weight of the tree a spanning-tree algorithm built: Prim's parent edges, or Kruskal's kept ones. */
const treeWeight = (timeline: GraphTimeline, frame: GraphFrame) =>
  timeline.graph.edges.reduce(
    (sum, e, k) => sum + (frame.edgeStates[k] === EDGE_KEPT || frame.parent.includes(k) ? e.w : 0),
    0,
  );

/** What a finished run came up with, in a few words. */
const outcome = (algorithm: GraphAlgorithm, timeline: GraphTimeline) => {
  const end = timeline.frameAt(Infinity);
  if (algorithm === "prim" || algorithm === "kruskal") return `weight ${treeWeight(timeline, end)}`;
  if (algorithm === "topo") {
    const left = end.states.filter((s) => s !== DONE).length;
    return left === 0 ? "in order" : "a loop";
  }
  return `${count(end.stats.visited, "node")}`;
};

type LaneProps = {
  algorithm: GraphAlgorithm;
  timeline: GraphTimeline;
  clock: number;
  place: number;
  className?: string;
};

const GraphRaceLane = ({ algorithm, timeline, clock, place, className }: LaneProps) => {
  const last = timeline.length - 1;
  const frame = timeline.frameAt(Math.min(clock, last));
  const finished = clock > 0 && clock >= last;
  const { title, short } = graphAlgorithms[algorithm];
  return (
    <section
      aria-label={`${title}${finished ? `, finished ${ordinal(place)}` : ""}`}
      className={cn(
        "flex min-h-0 min-w-0 flex-col gap-1 rounded-3xl border border-edge bg-surface p-2 ring-1 ring-transparent transition-shadow md:p-3",
        { "ring-primary": finished && place === 1 },
        className,
      )}
    >
      <header className="flex items-center gap-2 px-1 text-xs text-foreground md:text-sm">
        {/* Lanes are narrow on phones: the short name fits. */}
        <h3 className="truncate font-semibold">
          <span className="md:hidden">{short}</span>
          <span className="hidden md:inline">{title}</span>
        </h3>
        {finished && <PlaceBadge place={place} />}
        <span className="ml-auto whitespace-nowrap font-mono text-foreground/70">
          {finished ? outcome(algorithm, timeline) : `${format(Math.min(clock, last))} steps`}
        </span>
      </header>
      <GraphCanvas frame={frame} algorithm={algorithm} />
    </section>
  );
};

type Row = { algorithm: GraphAlgorithm; timeline: GraphTimeline; place: number };

/** A line on what the race showed: Prim and Kruskal's equal trees if both ran, else who had the least to do. */
const Verdict = ({ rows }: { rows: Row[] }) => {
  const prim = rows.find((r) => r.algorithm === "prim");
  const kruskal = rows.find((r) => r.algorithm === "kruskal");
  if (prim && kruskal) {
    const weight = treeWeight(prim.timeline, prim.timeline.frameAt(Infinity));
    return (
      <p className="text-sm text-foreground/80">
        Prim and Kruskal both found a tree of weight {weight}: Prim in {format(prim.timeline.length - 1)} steps, Kruskal
        in {format(kruskal.timeline.length - 1)}.
      </p>
    );
  }
  return (
    <p className="text-sm text-foreground/80">
      {graphAlgorithms[rows[0].algorithm].short} had the least to do: {format(rows[0].timeline.length - 1)} steps.
    </p>
  );
};

const GraphRaceResults = ({ rows, onReplay }: { rows: Row[]; onReplay: () => void }) => (
  <ResultsOverlay onReplay={onReplay}>
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-foreground/60">
          <th className="pb-2 font-normal">Place</th>
          <th className="pb-2 font-normal">Algorithm</th>
          <th className="pb-2 text-right font-normal">Steps</th>
          <th className="pb-2 text-right font-normal">Result</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ algorithm, timeline, place }) => (
          <tr key={algorithm} className="border-t border-line/60">
            <td className="py-2">
              <PlaceBadge place={place} />
            </td>
            <td className="py-2 font-semibold">{graphAlgorithms[algorithm].short}</td>
            <td className="py-2 text-right font-mono">{format(timeline.length - 1)}</td>
            <td className="py-2 text-right font-mono text-foreground/80">{outcome(algorithm, timeline)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <Verdict rows={rows} />
  </ResultsOverlay>
);

/** All racers on the same graph, two per row, one step per tick each. */
export const GraphRaceLanes = () => {
  const { algorithms, timelines, clock, replay } = useStore(
    useShallow((s) => ({
      algorithms: s.graphRaceAlgorithms,
      timelines: s.graphRaceTimelines,
      clock: s.frameIndex,
      replay: s.play,
    })),
  );
  // Fewer steps finishes first; ties share a place.
  const placeOf = (t: GraphTimeline) => 1 + timelines.filter((o) => o.length < t.length).length;
  const lanes = algorithms.length;
  const finished = clock > 0 && timelines.every((t) => clock >= t.length - 1);
  const rows = algorithms
    .map((algorithm, k) => ({ algorithm, timeline: timelines[k], place: timelines[k] ? placeOf(timelines[k]) : 0 }))
    .filter((r) => r.timeline)
    .sort((a, b) => a.place - b.place);

  return (
    <div data-tour="bars" className="relative flex min-h-0 flex-1">
      <div className={cn("grid min-h-0 w-full grid-cols-2 gap-2 md:gap-3", lanes > 2 ? "grid-rows-2" : "grid-rows-1")}>
        {algorithms.map(
          (algorithm, k) =>
            timelines[k] && (
              <GraphRaceLane
                key={algorithm}
                algorithm={algorithm}
                timeline={timelines[k]}
                clock={clock}
                place={placeOf(timelines[k])}
                className={cn({ "col-span-2": lanes === 3 && k === 2 })}
              />
            ),
        )}
      </div>
      {finished && rows.length > 0 && <GraphRaceResults rows={rows} onReplay={replay} />}
    </div>
  );
};
