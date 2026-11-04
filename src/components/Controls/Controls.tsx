import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon, ResetIcon, UpdateIcon } from "@radix-ui/react-icons";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { selectLastIndex, useStore } from "@/store";
import { cn } from "@/utils/cn";
import { useModuleUI } from "@/modules";
import { SettingsMenu } from "../Settings/ModuleSettings";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { Playback } from "./Playback";
import { Progress } from "./Progress";
import { SpeedControl, SpeedCycleButton } from "./SpeedControl";

/**
 * The floating dock under the stage. Wide: one row with the transport, the
 * timeline, speed and settings. Phones: the timeline on top and a row of round
 * buttons around a large Play.
 */
export const Controls = ({ className }: { className?: string }) => {
  const { newRunLabel } = useModuleUI();
  const { isPlaying, play, pause, stepForward, stepBackward, createNewArray, atStart, atEnd } = useStore(
    useShallow((s) => ({
      isPlaying: s.isPlaying,
      play: s.play,
      pause: s.pause,
      stepForward: s.stepForward,
      stepBackward: s.stepBackward,
      createNewArray: s.createNewArray,
      // Booleans, so the dock only re-renders when they flip.
      atStart: s.frameIndex === 0,
      atEnd: s.frameIndex === selectLastIndex(s),
    }))
  );

  const prev = (
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
  );
  const next = (
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
  );
  const playLabel = isPlaying ? "Pause" : atEnd ? "Replay" : "Play";
  // The main action: the only filled button, round and larger than the rest.
  const playButton = (
    <Button
      variant="primary"
      data-tour="play"
      className="h-16 w-16 shrink-0 px-0 md:h-14 md:w-14 [&_svg]:size-6 md:[&_svg]:size-5"
      onClick={isPlaying ? pause : play}
      aria-label={playLabel}
      aria-keyshortcuts="Space"
      title={`${playLabel} (Space)`}
    >
      {isPlaying ? <PauseIcon /> : atEnd ? <ResetIcon /> : <PlayIcon />}
    </Button>
  );
  const newArray = (
    <Button
      size="icon"
      className="shrink-0"
      onClick={createNewArray}
      aria-label={newRunLabel}
      aria-keyshortcuts="R"
      title={`${newRunLabel} (R)`}
    >
      <UpdateIcon />
    </Button>
  );

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-3xl border border-edge bg-surface p-4 shadow-(--shadow-dock) md:flex-row md:items-center md:gap-3 md:px-4 md:py-3",
        className
      )}
    >
      <Playback />
      <KeyboardShortcuts />

      {/* Phones: timeline first, buttons under it, within thumb reach. */}
      <Progress className="md:hidden" />
      <div className="flex items-center justify-between md:hidden">
        <SpeedCycleButton />
        {prev}
        {playButton}
        {next}
        {newArray}
      </div>

      <div className="hidden items-center gap-2 md:flex">
        {prev}
        {playButton}
        {next}
      </div>
      <Progress className="hidden flex-1 px-2 md:flex" />
      <div className="hidden items-center gap-2 md:flex">
        {/* Upright tablets keep the phone's one-button speed, so the timeline and counters keep their room. */}
        <SpeedCycleButton className="lg:hidden" />
        <SpeedControl className="hidden lg:flex" />
        <SettingsMenu className="hidden lg:flex" />
        {newArray}
      </div>
    </div>
  );
};
