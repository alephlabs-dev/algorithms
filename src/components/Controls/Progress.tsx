import { useShallow } from "zustand/react/shallow";
import { selectLastIndex, useStore } from "@/store";
import { Slider } from "../ui/slider";

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

  return (
    <div className="flex items-center gap-4">
      <span className="min-w-28 whitespace-nowrap font-mono text-xs">
        {isRace ? "Ops" : "Step"} {frameIndex.toLocaleString("en-US")} /{" "}
        {lastIndex.toLocaleString("en-US")}
      </span>
      <Slider
        aria-label="Progress"
        value={[frameIndex]}
        min={0}
        max={lastIndex}
        step={1}
        onValueChange={([value]) => seek(value)}
        // Dragging snaps bars into place; letting go turns animation back on.
        onPointerDown={() => setScrubbing(true)}
        onValueCommit={() => setScrubbing(false)}
      />
    </div>
  );
};
