import { useShallow } from "zustand/react/shallow";
import { selectLastIndex, useStore } from "@/store";
import { cn } from "@/utils/cn";
import { useModuleUI } from "@/modules";
import { Slider } from "../ui/slider";

const format = (n: number) => n.toLocaleString("en-US");

/** The timeline with the position and the counters under it. Kept apart from the dock because it re-renders on every frame. */
export const Progress = ({ className }: { className?: string }) => {
  const { race, Stats } = useModuleUI();
  const { frameIndex, lastIndex, seek, setScrubbing, isRace } = useStore(
    useShallow((s) => ({
      frameIndex: s.frameIndex,
      lastIndex: selectLastIndex(s),
      seek: s.seek,
      setScrubbing: s.setScrubbing,
      isRace: s.view === "race",
    }))
  );
  const unit = isRace ? race.unit.one : "step";

  return (
    <div className={cn("flex min-w-0 flex-col gap-2.5", className)}>
      <Slider
        aria-label="Progress"
        aria-valuetext={`${unit} ${format(frameIndex)} of ${format(lastIndex)}`}
        value={[frameIndex]}
        min={0}
        max={lastIndex}
        step={1}
        onValueChange={([value]) => seek(value)}
        // Dragging snaps bars into place; letting go turns animation back on.
        onPointerDown={() => setScrubbing(true)}
        onValueCommit={() => setScrubbing(false)}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 font-mono text-xs text-foreground/70">
        <span aria-hidden className="whitespace-nowrap">
          {isRace ? "" : "step "}
          {format(frameIndex)} / {format(lastIndex)}
          {isRace && ` ${race.unit.short}`}
        </span>
        {!isRace && <Stats />}
      </div>
    </div>
  );
};
