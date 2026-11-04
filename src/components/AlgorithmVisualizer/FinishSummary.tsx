import { CheckCircledIcon } from "@radix-ui/react-icons";
import { useShallow } from "zustand/react/shallow";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { selectFrame, selectLastIndex, useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";


/** Shown over the bars when a run finishes: what it took, and a way to compare. */
export const FinishSummary = ({ className }: { className?: string }) => {
  const { finished, steps, stats, algorithm, raceWith } = useStore(
    useShallow((s) => ({
      finished: s.frameIndex > 0 && s.frameIndex === selectLastIndex(s),
      steps: selectLastIndex(s),
      stats: selectFrame(s).stats,
      algorithm: s.activeAlgorithm,
      raceWith: s.raceWith,
    }))
  );
  const { countsWrites } = sortingAlgorithms[algorithm];

  return (
    // Always mounted so screen readers announce the text when it appears.
    <div role="status" className={cn("pointer-events-none", className)}>
      {/* Appears as the finishing sweep reaches the end. */}
      {finished && (
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-edge bg-surface/90 px-5 py-2 text-sm text-foreground shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300 [animation-delay:800ms] [animation-fill-mode:both] motion-reduce:animate-none">
          <span className="flex items-center gap-1.5 font-semibold text-primary">
            <CheckCircledIcon className="h-4 w-4" /> Sorted
          </span>
          <span className="font-mono text-xs text-foreground/80">
            {count(steps, "step")} · {count(stats.comparisons, "comparison")} ·{" "}
            {countsWrites ? count(stats.writes, "write") : count(stats.swaps, "swap")}
          </span>
          <button
            type="button"
            onClick={() => raceWith(algorithm)}
            className="rounded-full text-sm font-semibold underline decoration-line underline-offset-4 hover:decoration-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            Race it
          </button>
        </div>
      )}
    </div>
  );
};
