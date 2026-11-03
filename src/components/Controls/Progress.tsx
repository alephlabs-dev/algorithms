import { useShallow } from "zustand/react/shallow";
import { selectFrame, useStore } from "@/store";
import { Slider } from "../ui/slider";

// Kept separate from Controls because it re-renders on every frame.
export const Progress = () => {
  const { frameIndex, lastIndex, stats, seek, countsWrites } = useStore(
    useShallow((s) => ({
      frameIndex: s.frameIndex,
      lastIndex: s.frames.length - 1,
      stats: selectFrame(s).stats,
      seek: s.seek,
      // Merge sort moves values by writing them, not by swapping.
      countsWrites: s.activeAlgorithm === "merge",
    }))
  );

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-sm text-foreground">
      <div className="flex items-center gap-4 flex-1">
        <span className="tabular-nums whitespace-nowrap min-w-[7.5rem]">
          Step {frameIndex} / {lastIndex}
        </span>
        <Slider
          aria-label="Progress"
          value={[frameIndex]}
          min={0}
          max={lastIndex}
          step={1}
          onValueChange={([value]) => seek(value)}
        />
      </div>
      <dl className="flex gap-6 tabular-nums whitespace-nowrap">
        <div className="flex gap-2">
          <dt>Comparisons</dt>
          <dd className="font-semibold min-w-[3ch]">{stats.comparisons}</dd>
        </div>
        <div className="flex gap-2">
          <dt>{countsWrites ? "Writes" : "Swaps"}</dt>
          <dd className="font-semibold min-w-[3ch]">
            {countsWrites ? stats.writes : stats.swaps}
          </dd>
        </div>
      </dl>
    </div>
  );
};
