import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { Slider } from "../ui/slider";

// Kept separate from Controls because it re-renders on every frame.
export const Progress = () => {
  const { frameIndex, lastIndex, seek } = useStore(
    useShallow((s) => ({
      frameIndex: s.frameIndex,
      lastIndex: s.frames.length - 1,
      seek: s.seek,
    }))
  );

  return (
    <div className="flex items-center gap-4">
      <span className="tabular-nums whitespace-nowrap min-w-[6.5rem]">
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
  );
};
