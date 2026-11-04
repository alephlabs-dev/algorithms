import { useShallow } from "zustand/react/shallow";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { selectFrame, selectLastIndex, useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";


const Swatch = ({ className, label }: { className: string; label: string }) => (
  <li className="flex items-center gap-2">
    <span aria-hidden className={cn("h-2.5 w-2.5 shrink-0 rounded-full", className)} />
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
        stacked ? "flex-col gap-1.5" : "flex-wrap items-center gap-x-4 gap-y-1",
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
      {count(stats.comparisons, "comparison")} ·{" "}
      {countsWrites ? count(stats.writes, "write") : count(stats.swaps, "swap")}
    </p>
  );
};
