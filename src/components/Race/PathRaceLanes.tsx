import { useShallow } from "zustand/react/shallow";
import { pathAlgorithms } from "@/consts/pathAlgorithms";
import type { PathAlgorithm, PathTimeline } from "@/pathfinding";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { describeFrame } from "@/utils/describePathFrame";
import { ordinal } from "@/utils/ordinal";
import { GridCanvas } from "../Pathfinding/PathStage";
import { PlaceBadge, ResultsOverlay } from "./RaceParts";
import { localized } from "@/i18n";

const text = localized({
  en: {
    cost: (n: number) => `cost ${n}`,
    cells: (n: string) => `${n} cells`,
    finished: (place: string) => ` Finished ${place}.`,
    unreachable: "The target can't be reached.",
    both: (name: string) => (
      <>
        {name} looked at the fewest cells <em>and</em> found the cheapest path.
      </>
    ),
    cheaper: (name: string, best: string, detail: string) => `${name} finished first, but ${best} found a cheaper path${detail}.`,
    insteadOf: (cheapest: number, cost: number) => ` (${cheapest} instead of ${cost})`,
    place: "Place",
    search: "Search",
    lookedAt: "Looked at",
    pathCost: "Path cost",
    costing: (steps: number, cost: number) => `${count(steps, "step")}, costing ${cost}`,
    cheapest: "Cheapest: ",
    none: "none",
  },
  es: {
    cost: (n) => `costo ${n}`,
    cells: (n) => `${n} celdas`,
    finished: (place) => ` Terminó ${place}.`,
    unreachable: "El destino es inalcanzable.",
    both: (name) => (
      <>
        {name} revisó menos celdas <em>y</em> encontró el camino más barato.
      </>
    ),
    cheaper: (name, best, detail) => `${name} terminó primero, pero ${best} encontró un camino más barato${detail}.`,
    insteadOf: (cheapest, cost) => ` (${cheapest} en vez de ${cost})`,
    place: "Lugar",
    search: "Búsqueda",
    lookedAt: "Revisadas",
    pathCost: "Costo",
    costing: (steps, cost) => `${count(steps, "paso")}, costo ${cost}`,
    cheapest: "Más barato: ",
    none: "ninguno",
  },
});


const format = (n: number) => n.toLocaleString("en-US");

/** A search's result once it's over: whether it got there and what the path costs. */
const outcomeOf = (timeline: PathTimeline) => timeline.frameAt(timeline.length - 1);

type LaneProps = {
  algorithm: PathAlgorithm;
  timeline: PathTimeline;
  /** The shared clock, in cells examined. */
  clock: number;
  place: number;
  className?: string;
};

const PathRaceLane = ({ algorithm, timeline, clock, place, className }: LaneProps) => {
  const frame = timeline.frameAt(timeline.frameIndexAtVisits(clock));
  const finished = clock > 0 && clock >= timeline.totalVisits;
  const { title, short } = pathAlgorithms[algorithm];

  return (
    <section
      aria-label={title}
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
          {finished && frame.found ? text.cost(frame.stats.pathCost) : text.cells(format(frame.stats.visited))}
        </span>
      </header>
      <GridCanvas
        frame={frame}
        label={`${title}: ${describeFrame(frame)}${finished ? text.finished(ordinal(place)) : ""}`}
      />
    </section>
  );
};

type Row = { algorithm: PathAlgorithm; timeline: PathTimeline; place: number };

/** Who got there first, and whether that was also the best path: they often aren't the same. */
const Verdict = ({ rows }: { rows: Row[] }) => {
  const found = rows.filter((r) => outcomeOf(r.timeline).found);
  if (found.length === 0) return <p className="text-sm text-foreground/80">{text.unreachable}</p>;
  const cheapest = Math.min(...found.map((r) => outcomeOf(r.timeline).stats.pathCost));
  const winner = rows[0];
  const winnerCost = outcomeOf(winner.timeline).stats.pathCost;
  const name = pathAlgorithms[winner.algorithm].short;
  if (outcomeOf(winner.timeline).found && winnerCost === cheapest) {
    return (
      <p className="text-sm text-foreground/80">{text.both(name)}</p>
    );
  }
  const best = found.filter((r) => outcomeOf(r.timeline).stats.pathCost === cheapest)[0];
  return (
    <p className="text-sm text-foreground/80">
      {text.cheaper(
        name,
        pathAlgorithms[best.algorithm].short,
        outcomeOf(winner.timeline).found ? text.insteadOf(cheapest, winnerCost) : "",
      )}
    </p>
  );
};

const PathRaceResults = ({ rows, onReplay }: { rows: Row[]; onReplay: () => void }) => {
  const costs = rows
    .map((r) => outcomeOf(r.timeline))
    .filter((f) => f.found)
    .map((f) => f.stats.pathCost);
  const cheapest = Math.min(...costs);
  return (
    <ResultsOverlay onReplay={onReplay}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-foreground/60">
            <th className="pb-2 font-normal">{text.place}</th>
            <th className="pb-2 font-normal">{text.search}</th>
            <th className="pb-2 text-right font-normal">{text.lookedAt}</th>
            <th className="pb-2 text-right font-normal">{text.pathCost}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ algorithm, timeline, place }) => {
            const { found, stats } = outcomeOf(timeline);
            return (
              <tr key={algorithm} className="border-t border-line/60">
                <td className="py-2">
                  <PlaceBadge place={place} />
                </td>
                <td className="py-2 font-semibold">{pathAlgorithms[algorithm].short}</td>
                <td className="py-2 text-right font-mono">{format(timeline.totalVisits)}</td>
                <td
                  className="py-2 text-right font-mono"
                  title={found ? text.costing(stats.pathLength, stats.pathCost) : undefined}
                >
                  {found ? (
                    <span className={cn({ "font-semibold text-primary": stats.pathCost === cheapest })}>
                      {stats.pathCost === cheapest && <span className="sr-only">{text.cheapest}</span>}
                      {stats.pathCost}
                    </span>
                  ) : (
                    <span className="text-foreground/60">{text.none}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Verdict rows={rows} />
    </ResultsOverlay>
  );
};

/** All racers on the same grid, two per row, on one clock: one cell examined per tick. */
export const PathRaceLanes = () => {
  const { algorithms, timelines, clock, replay } = useStore(
    useShallow((s) => ({
      algorithms: s.pathRaceAlgorithms,
      timelines: s.pathRaceTimelines,
      clock: s.frameIndex,
      replay: s.play,
    })),
  );
  // Fewer cells looked at finishes first; ties share a place.
  const placeOf = (t: PathTimeline) => 1 + timelines.filter((o) => o.totalVisits < t.totalVisits).length;
  const lanes = algorithms.length;
  const finished = clock > 0 && timelines.every((t) => clock >= t.totalVisits);
  const rows = algorithms
    .map((algorithm, k) => ({ algorithm, timeline: timelines[k], place: placeOf(timelines[k]) }))
    .filter((r) => r.timeline)
    .sort((a, b) => a.place - b.place);

  return (
    <div data-tour="bars" className="relative flex min-h-0 flex-1">
      {/* Grids keep their shape, so two per row fits them best even on phones. */}
      <div className={cn("grid min-h-0 w-full grid-cols-2 gap-2 md:gap-3", lanes > 2 ? "grid-rows-2" : "grid-rows-1")}>
        {algorithms.map(
          (algorithm, k) =>
            timelines[k] && (
              <PathRaceLane
                key={algorithm}
                algorithm={algorithm}
                timeline={timelines[k]}
                clock={clock}
                place={placeOf(timelines[k])}
                // With three racers, the last lane takes the full bottom row.
                className={cn({ "col-span-2": lanes === 3 && k === 2 })}
              />
            ),
        )}
      </div>
      {finished && <PathRaceResults rows={rows} onReplay={replay} />}
    </div>
  );
};
