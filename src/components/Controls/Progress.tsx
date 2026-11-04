import { useShallow } from "zustand/react/shallow";
import { selectLastIndex, useStore } from "@/store";
import { Slider } from "../ui/slider";

const format = (n: number) => n.toLocaleString("en-US");

// Kept separate from Controls because it re-renders on every frame.
export const Progress = () => {
  const { frameIndex, lastIndex, seek, setScrubbing, isRace } = useStore(
    useShallow((s) => ({
      frameIndex: s.frameIndex,
      lastIndex: selectLastIndex(s),
      seek: s.seek,
      setScrubbing: s.setScrubbing,
      isRace: s.view === "race",
    }))
  );
  const unit = isRace ? "operation" : "step";

  return (
    <div className="flex items-center gap-4">
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
      <span className="shrink-0 whitespace-nowrap font-mono text-xs text-foreground/80" aria-hidden>
        {format(frameIndex)} / {format(lastIndex)}
        {isRace && <span className="text-foreground/60"> ops</span>}
      </span>
    </div>
  );
};
