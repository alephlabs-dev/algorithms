import { useShallow } from "zustand/react/shallow";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { selectFrame, selectLastIndex, useStore } from "@/store";
import { cn } from "@/utils/cn";
import { SectionLabel } from "./ui/section-label";

const format = (n: number) => n.toLocaleString("en-US");

const Swatch = ({ className, label }: { className: string; label: string }) => (
  <li className="flex items-center gap-2">
    <span aria-hidden className={cn("h-3 w-3 shrink-0 rounded-xs", className)} />
    {label}
  </li>
);

/** What each bar color means. Yellow means something different per algorithm, so races leave it out. */
export const Legend = ({ className, stacked }: { className?: string; stacked?: boolean }) => {
  const tempLabel = useStore((s) =>
    s.view === "race" ? undefined : sortingAlgorithms[s.activeAlgorithm].tempLabel
  );
  return (
    <ul
      aria-label="Legend"
      className={cn(
        "flex text-xs text-foreground md:text-sm",
        stacked ? "flex-col gap-2" : "flex-wrap items-center gap-x-4 gap-y-1",
        className
      )}
    >
      <Swatch className="bg-secondary" label="Comparing" />
      {tempLabel && <Swatch className="bg-tertiary" label={tempLabel} />}
      <Swatch className="bg-primary" label="Final position" />
    </ul>
  );
};

// Re-renders on every frame, so these stay small.
const useStats = () =>
  useStore(
    useShallow((s) => ({
      stats: selectFrame(s).stats,
      step: s.frameIndex,
      lastIndex: selectLastIndex(s),
      countsWrites: sortingAlgorithms[s.activeAlgorithm].countsWrites,
    }))
  );

/** Counters on one line, for narrow layouts. */
export const StatsInline = ({ className }: { className?: string }) => {
  const { stats, countsWrites } = useStats();
  return (
    <p className={cn("whitespace-nowrap font-mono text-xs text-foreground/80", className)}>
      {format(stats.comparisons)} comp · {format(countsWrites ? stats.writes : stats.swaps)}{" "}
      {countsWrites ? "writes" : "swaps"}
    </p>
  );
};

/** Counters and legend as a card beside the bars, on wide screens. */
export const StatsCard = ({ className }: { className?: string }) => {
  const { stats, countsWrites } = useStats();
  // The step count is on the timeline below, so the card keeps to the counters.
  const rows: [string, string][] = [
    ["Comparisons", format(stats.comparisons)],
    [countsWrites ? "Writes" : "Swaps", format(countsWrites ? stats.writes : stats.swaps)],
  ];
  return (
    <section aria-label="Run" className={cn("flex shrink-0 flex-col gap-3 rounded-sm bg-accent/40 p-4", className)}>
      <SectionLabel>Run</SectionLabel>
      <dl className="flex flex-col gap-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <dt className="text-foreground/70">{label}</dt>
            <dd className="font-mono font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="h-px bg-line/60" />
      <Legend stacked className="gap-1.5" />
    </section>
  );
};
