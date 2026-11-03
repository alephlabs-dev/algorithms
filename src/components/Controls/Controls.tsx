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
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { Playback } from "./Playback";
import { SpeedSlider } from "./SpeedSlider";
import { StatusBar } from "./StatusBar";

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
      atEnd: s.frameIndex === s.timeline.length - 1,
    }))
  );

  return (
    <div className="flex flex-col gap-4">
      <Playback />
      <KeyboardShortcuts />
      <StatusBar />
      <div className="flex flex-col md:flex-row items-center gap-4">
        <SpeedSlider />
        <div className="flex items-center gap-2 xl:gap-4 w-full md:w-auto">
          <Button
            variant="ghost"
            className={cn(buttonClass, "px-3 shrink-0")}
            onClick={stepBackward}
            disabled={atStart}
            aria-label="Previous step"
            aria-keyshortcuts="ArrowLeft"
            title="Previous step (←)"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            className={cn(buttonClass, "px-4 w-full md:w-32 xl:w-40")}
            onClick={isPlaying ? pause : play}
            aria-keyshortcuts="Space"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
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
            aria-keyshortcuts="ArrowRight"
            title="Next step (→)"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            className={cn(buttonClass, "px-4 w-full md:w-32 xl:w-40")}
            onClick={createNewArray}
            aria-keyshortcuts="R"
            title="New array (R)"
            disabled={isPlaying}
          >
            <UpdateIcon className="h-4 w-4 mr-2" /> Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
