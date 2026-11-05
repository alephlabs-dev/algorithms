import { useShallow } from "zustand/react/shallow";
import type { Timeline } from "@/algorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { useStore } from "@/store";
import type { Algorithm } from "@/types";
import { cn } from "@/utils/cn";
import { ArrayCanvas } from "../AlgorithmVisualizer/ArrayCanvas";
import { ordinal } from "@/utils/ordinal";
import { PlaceBadge } from "./RaceParts";
import { RaceResults } from "./RaceResults";
import { lang, localized } from "@/i18n";

const text = localized({
  en: {
    ops: (ops: string) => `${ops} ops`,
    label: (title: string, ops: string, total: string, place?: string) =>
      `${title}: ${ops} of ${total} operations${place ? `, finished ${place}` : ""}.`,
  },
  es: {
    ops: (ops) => `${ops} ops`,
    label: (title, ops, total, place) =>
      `${title}: ${ops} de ${total} operaciones${place ? `, terminó ${place}` : ""}.`,
  },
});

const formatOps = (n: number) => n.toLocaleString(lang === "es" ? "es" : "en-US");

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
        "flex min-h-0 flex-col gap-1 rounded-3xl border border-edge bg-surface p-3 md:p-4 ring-1 ring-transparent transition-shadow",
        { "ring-primary": finished && place === 1 },
        className
      )}
    >
      <header className="flex items-center gap-2 text-xs md:text-sm text-foreground">
        <h3 className="truncate font-semibold">{title}</h3>
        {finished && <PlaceBadge place={place} />}
        <span className="ml-auto whitespace-nowrap font-mono text-foreground/70">
          {text.ops(formatOps(ops))}
        </span>
      </header>
      <ArrayCanvas
        frame={frame}
        values={timeline.values}
        mode="bars"
        celebrate={finished}
        runId={runId}
        label={text.label(title, formatOps(ops), formatOps(timeline.totalOps), finished ? ordinal(place) : undefined)}
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
          // Two racers: stacked on phones (each lane stays wide), side by side from tablet width up.
          // Three or four: a 2×2 grid everywhere, so lanes on phones don't get too short.
          "grid-rows-2 md:grid-rows-1 md:grid-cols-2": count === 2,
          "grid-cols-2 grid-rows-2": count >= 3,
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
            className={cn({ "col-span-2": count === 3 && k === 2 })}
          />
        ))}
      </div>
      {finished && (
        <RaceResults algorithms={algorithms} timelines={timelines} placeOf={placeOf} onReplay={replay} />
      )}
    </div>
  );
};
