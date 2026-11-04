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
import { cn } from "@/utils/cn";
import { Legend } from "../RunInfo";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { Playback } from "./Playback";
import { Progress } from "./Progress";
import { ShortcutsHelp } from "./ShortcutsHelp";
import { SpeedControl, SpeedCycleButton } from "./SpeedControl";

/**
 * Below the bars: legend, timeline, then one row of transport buttons with the
 * speed. On xl the legend moves to the card beside the bars (single view).
 */
export const Controls = () => {
  const { isPlaying, play, pause, stepForward, stepBackward, createNewArray, atStart, atEnd, isRace } =
    useStore(
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
        isRace: s.view === "race",
      }))
    );

  return (
    <div className="flex flex-col gap-3">
      <Playback />
      <KeyboardShortcuts />
      <Legend className={cn({ "xl:hidden": !isRace })} />
      <Progress />
      <div className="flex items-center gap-2">
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
          className="flex-1 md:w-32 md:flex-none"
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
        <SpeedCycleButton className="md:hidden" />
        <Button
          className="w-11 shrink-0 px-0 xl:w-auto xl:px-4"
          onClick={createNewArray}
          aria-keyshortcuts="R"
          title="New array (R)"
          aria-label="New array"
        >
          <UpdateIcon />
          <span className="hidden xl:inline">New array</span>
        </Button>
        <SpeedControl className="ml-auto hidden md:flex" />
        <ShortcutsHelp />
      </div>
    </div>
  );
};
