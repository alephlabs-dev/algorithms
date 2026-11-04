import { useShallow } from "zustand/react/shallow";
import type { Timeline } from "@/algorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { useStore } from "@/store";
import type { Algorithm } from "@/types";
import { cn } from "@/utils/cn";
import { ArrayCanvas } from "../AlgorithmVisualizer/ArrayCanvas";
import { RaceResults } from "./RaceResults";

const ordinal = (n: number) => ["1st", "2nd", "3rd", "4th"][n - 1] ?? `${n}th`;
const formatOps = (n: number) => n.toLocaleString("en-US");

type LaneProps = {
  algorithm: Algorithm;
  timeline: Timeline;
  /** The shared clock, in operations. */
  clock: number;
  /** Finishing position, known up front since every run is precomputed. */
  place: number;
  runId: number;
  className?: string;
};

const RaceLane = ({ algorithm, timeline, clock, place, runId, className }: LaneProps) => {
  // Before the first operation every lane shows the untouched array, not the
  // setup highlights some algorithms emit before their first comparison.
  const frame = timeline.frameAt(clock === 0 ? 0 : timeline.frameIndexAtOps(clock));
  const finished = clock > 0 && clock >= timeline.totalOps;
  const ops = Math.min(clock, timeline.totalOps);
  const { title } = sortingAlgorithms[algorithm];

  return (
    <section
      aria-label={title}
      className={cn(
        "flex min-h-0 flex-col gap-1 rounded-sm bg-accent/40 p-2 md:p-3 ring-1 ring-transparent transition-shadow",
        { "ring-primary": finished && place === 1 },
        className
      )}
    >
      <header className="flex items-center gap-2 text-xs md:text-sm text-foreground">
        <h3 className="truncate font-semibold">{title}</h3>
        {finished && (
          <span
            className={cn("rounded-sm px-1.5 py-0.5 font-mono text-xs font-semibold", {
              "bg-primary text-background": place === 1,
              "bg-foreground/15": place !== 1,
            })}
          >
            {ordinal(place)}
          </span>
        )}
        <span className="ml-auto whitespace-nowrap font-mono text-foreground/70">
          {formatOps(ops)} ops
        </span>
      </header>
      <ArrayCanvas
        frame={frame}
        values={timeline.values}
        mode="bars"
        celebrate={finished}
        runId={runId}
        label={`${title}: ${formatOps(ops)} of ${formatOps(timeline.totalOps)} operations${finished ? `, finished ${ordinal(place)}` : ""}.`}
      />
    </section>
  );
};

/** All racers side by side (2×2 from tablet width, stacked on phones), on one operation clock. */
export const RaceLanes = () => {
  const { algorithms, timelines, clock, runId, replay } = useStore(
    useShallow((s) => ({
      algorithms: s.raceAlgorithms,
      timelines: s.raceTimelines,
      clock: s.frameIndex,
      runId: s.arrayId,
      // play() restarts from the beginning once the run has finished.
      replay: s.play,
    }))
  );
  // Ties share a place.
  const placeOf = (t: Timeline) => 1 + timelines.filter((o) => o.totalOps < t.totalOps).length;
  const count = algorithms.length;

  const finished = clock > 0 && timelines.every((t) => clock >= t.totalOps);

  return (
    <div className="relative flex min-h-0 flex-1">
      <div
        className={cn("grid min-h-0 w-full gap-2 md:gap-3", {
          // Two columns from tablet width up; phones stack the lanes.
          "grid-rows-2 md:grid-rows-1 md:grid-cols-2": count === 2,
          "grid-rows-3 md:grid-rows-2 md:grid-cols-2": count === 3,
          "grid-rows-4 md:grid-rows-2 md:grid-cols-2": count === 4,
        })}
      >
        {algorithms.map((algorithm, k) => (
          <RaceLane
            key={algorithm}
            algorithm={algorithm}
            timeline={timelines[k]}
            clock={clock}
            place={placeOf(timelines[k])}
            runId={runId}
            // With three racers on a 2×2 grid, the last lane takes the full bottom row.
            className={cn({ "md:col-span-2": count === 3 && k === 2 })}
          />
        ))}
      </div>
      {finished && (
        <RaceResults algorithms={algorithms} timelines={timelines} placeOf={placeOf} onReplay={replay} />
      )}
    </div>
  );
};
