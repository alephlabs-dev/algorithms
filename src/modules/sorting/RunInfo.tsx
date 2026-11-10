import { useShallow } from "zustand/react/shallow";
import { sortingAlgorithms } from "./algorithms";
import { selectFrame, selectLastIndex, useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { localized } from "@/i18n";

const text = localized({
  en: {
    legend: "Legend",
    comparing: "Comparing",
    finalPosition: "Final position",
    comparisons: (n: number) => count(n, "comparison"),
    writes: (n: number) => count(n, "write"),
    swaps: (n: number) => count(n, "swap"),
    // The dock's one line of counters; the full words fit in English.
    short: null as null | { comparisons: (n: number) => string; writes: (n: number) => string; swaps: (n: number) => string },
  },
  es: {
    legend: "Leyenda",
    comparing: "Comparando",
    finalPosition: "Lugar final",
    comparisons: (n) => count(n, "comparación", "comparaciones"),
    writes: (n) => count(n, "escritura"),
    swaps: (n) => count(n, "intercambio"),
    // "comparaciones · intercambios" doesn't fit beside the desktop dock's speed control.
    short: {
      comparisons: (n) => `${n.toLocaleString("es")} comp.`,
      writes: (n) => `${n.toLocaleString("es")} escr.`,
      swaps: (n) => `${n.toLocaleString("es")} interc.`,
    },
  },
});
const Swatch = ({ className, label }: { className: string; label: string }) => (
  <li className="flex items-center gap-2">
    <span aria-hidden className={cn("h-2.5 w-2.5 shrink-0 rounded-full", className)} />
    {label}
  </li>
);

/** What each bar color means. Yellow means something different per algorithm, so races leave it out. */
export const Legend = ({ className }: { className?: string }) => {
  const tempLabel = useStore((s) =>
    s.view === "race" ? undefined : sortingAlgorithms[s.sorting.algorithm].tempLabel
  );
  return (
    <ul
      aria-label={text.legend}
      className={cn(
        "flex text-xs text-foreground md:text-sm",
        "flex-wrap items-center gap-x-4 gap-y-1",
        className
      )}
    >
      <Swatch className="bg-secondary" label={text.comparing} />
      {tempLabel && <Swatch className="bg-tertiary" label={tempLabel} />}
      <Swatch className="bg-primary" label={text.finalPosition} />
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
      countsWrites: sortingAlgorithms[s.sorting.algorithm].countsWrites,
    }))
  );

/** Counters on one line, for narrow layouts. */
export const StatsInline = ({ className }: { className?: string }) => {
  const { stats, countsWrites } = useStats();
  const full = `${text.comparisons(stats.comparisons)} · ${countsWrites ? text.writes(stats.writes) : text.swaps(stats.swaps)}`;
  if (!text.short) {
    return (
      <p className={cn("whitespace-nowrap font-mono text-xs text-foreground/80", className)}>
        {text.comparisons(stats.comparisons)} ·{" "}
        {countsWrites ? text.writes(stats.writes) : text.swaps(stats.swaps)}
      </p>
    );
  }
  const { comparisons, writes, swaps } = text.short;
  return (
    <p title={full} className={cn("whitespace-nowrap font-mono text-xs text-foreground/80", className)}>
      <span aria-hidden>
        {comparisons(stats.comparisons)} · {countsWrites ? writes(stats.writes) : swaps(stats.swaps)}
      </span>
      <span className="sr-only">{full}</span>
    </p>
  );
};
