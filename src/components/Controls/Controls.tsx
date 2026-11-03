import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  ResetIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { Playback } from "./Playback";
import { Progress } from "./Progress";
import { SpeedSlider } from "./SpeedSlider";

const buttonClass =
  "bg-background border-2 border-accent hover:bg-accent text-base text-foreground hover:text-foreground h-auto py-2";

export const Controls = () => {
  const {
    isPlaying,
    play,
    pause,
    stepForward,
    stepBackward,
    createNewArray,
    atStart,
    atEnd,
  } = useStore(
    useShallow((s) => ({
      isPlaying: s.isPlaying,
      play: s.play,
      pause: s.pause,
      stepForward: s.stepForward,
      stepBackward: s.stepBackward,
      createNewArray: s.createNewArray,
      // Booleans, so Controls only re-renders when they flip.
      atStart: s.frameIndex === 0,
      atEnd: s.frameIndex === s.frames.length - 1,
    }))
  );

  return (
    <div className="flex flex-col gap-4">
      <Playback />
      <Progress />
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <SpeedSlider />
        <div className="flex items-center gap-2 lg:gap-4 w-full lg:w-auto">
          <Button
            variant="ghost"
            className={cn(buttonClass, "px-3 shrink-0")}
            onClick={stepBackward}
            disabled={atStart}
            aria-label="Previous step"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            className={cn(buttonClass, "px-4 w-full lg:w-40")}
            onClick={isPlaying ? pause : play}
          >
            {isPlaying ? (
              <>
                <PauseIcon className="h-4 w-4 mr-2" /> Pause
              </>
            ) : atEnd ? (
              <>
                <ResetIcon className="h-4 w-4 mr-2" /> Replay
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 mr-2" /> Play
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            className={cn(buttonClass, "px-3 shrink-0")}
            onClick={stepForward}
            disabled={atEnd}
            aria-label="Next step"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            className={cn(buttonClass, "px-4 w-full lg:w-40")}
            onClick={createNewArray}
            disabled={isPlaying}
          >
            <UpdateIcon className="h-4 w-4 mr-2" /> Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
