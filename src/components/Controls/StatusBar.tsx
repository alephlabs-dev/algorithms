import { useShallow } from "zustand/react/shallow";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { selectFrame, useStore } from "@/store";
import { cn } from "@/utils/cn";
import { Progress } from "./Progress";

const Swatch = ({ className, label }: { className: string; label: string }) => (
  <li className="flex items-center gap-2">
    <span aria-hidden className={cn("h-3 w-3 rounded-xs", className)} />
    {label}
  </li>
);

const Legend = () => {
  // Yellow means something different per algorithm, so races leave it out.
  const tempLabel = useStore((s) =>
    s.view === "race" ? undefined : sortingAlgorithms[s.activeAlgorithm].tempLabel
  );

  return (
    <ul aria-label="Legend" className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1">
      <Swatch className="bg-secondary" label="Comparing" />
      {tempLabel && <Swatch className="bg-tertiary" label={tempLabel} />}
      <Swatch className="bg-primary" label="Final position" />
    </ul>
  );
};

// Re-renders on every frame, so it stays small.
const Stats = () => {
  const { stats, countsWrites } = useStore(
    useShallow((s) => ({
      stats: selectFrame(s).stats,
      countsWrites: sortingAlgorithms[s.activeAlgorithm].countsWrites,
    }))
  );

  return (
    <dl className="flex gap-6 whitespace-nowrap">
      <div className="flex gap-2">
        <dt>Comparisons</dt>
        <dd className="min-w-[3ch] font-mono font-semibold">{stats.comparisons}</dd>
      </div>
      <div className="flex gap-2">
        <dt>{countsWrites ? "Writes" : "Swaps"}</dt>
        <dd className="min-w-[3ch] font-mono font-semibold">
          {countsWrites ? stats.writes : stats.swaps}
        </dd>
      </div>
    </dl>
  );
};

/**
 * Legend, progress bar and counters. On phones the legend and counters share a
 * row above the progress bar; on wide screens all three fit on one row.
 */
export const StatusBar = () => {
  // Each race lane shows its own count, so the global counters are for single view.
  const isRace = useStore((s) => s.view === "race");
  return (
  <div className="flex flex-wrap xl:flex-nowrap items-center gap-x-6 gap-y-2 text-xs md:text-sm text-foreground">
    <div className="order-1">
      <Legend />
    </div>
    <div className="order-2 xl:order-3 ml-auto xl:ml-0">
      {!isRace && <Stats />}
    </div>
    <div className="order-3 xl:order-2 basis-full xl:basis-auto xl:flex-1">
      <Progress />
    </div>
  </div>
);
};
