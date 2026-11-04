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
import { selectLastIndex, useStore } from "@/store";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { Playback } from "./Playback";
import { ShortcutsHelp } from "./ShortcutsHelp";
import { SpeedSlider } from "./SpeedSlider";
import { StatusBar } from "./StatusBar";

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
      atEnd: s.frameIndex === selectLastIndex(s),
    }))
  );

  return (
    <div className="flex flex-col gap-4">
      <Playback />
      <KeyboardShortcuts />
      <StatusBar />
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <SpeedSlider />
        <div className="flex w-full items-center gap-2 md:w-auto xl:gap-3">
          <Button
            size="icon"
            className="shrink-0"
            onClick={stepBackward}
            disabled={atStart}
            aria-label="Previous step"
            aria-keyshortcuts="ArrowLeft"
            title="Previous step (←)"
          >
            <ChevronLeftIcon />
          </Button>
          {/* The main action: the only filled button in the bar. */}
          <Button
            variant="primary"
            className="w-full md:w-28 xl:w-36"
            onClick={isPlaying ? pause : play}
            aria-keyshortcuts="Space"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? (
              <>
                <PauseIcon /> Pause
              </>
            ) : atEnd ? (
              <>
                <ResetIcon /> Replay
              </>
            ) : (
              <>
                <PlayIcon /> Play
              </>
            )}
          </Button>
          <Button
            size="icon"
            className="shrink-0"
            onClick={stepForward}
            disabled={atEnd}
            aria-label="Next step"
            aria-keyshortcuts="ArrowRight"
            title="Next step (→)"
          >
            <ChevronRightIcon />
          </Button>
          <Button
            // Icon-only between md and xl so the speed slider keeps a usable width.
            className="w-full md:max-xl:w-11 md:max-xl:px-0 xl:w-36"
            onClick={createNewArray}
            aria-keyshortcuts="R"
            title="New array (R)"
            aria-label="New array"
          >
            <UpdateIcon />
            <span className="md:max-xl:sr-only">Reset</span>
          </Button>
          <ShortcutsHelp />
        </div>
      </div>
    </div>
  );
};
