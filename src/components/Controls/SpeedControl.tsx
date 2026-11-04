import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { formatStepsPerSecond, presetLabels, speedPresets, type SpeedPreset } from "@/utils/speed";
import { Button } from "../ui/button";
import { SegmentedControl } from "../ui/segmented";

const useSpeed = () =>
  useStore(
    useShallow((s) => ({ preset: s.speedPreset, speed: s.speed, setPreset: s.setSpeedPreset }))
  );

const HELP = "1× is a comfortable pace for this array; it adapts to the array size.";

/** Speed presets relative to a pace picked for each run. Wide layouts. */
export const SpeedControl = ({ className }: { className?: string }) => {
  const { preset, speed, setPreset } = useSpeed();
  return (
    <div data-tour="speed" className={cn("flex items-center gap-3", className)} title={`${HELP} Now ${formatStepsPerSecond(speed)} steps per second.`}>
      <SegmentedControl<SpeedPreset>
        label="Speed"
        options={speedPresets.map((p) => ({
          value: p,
          label: <span className="font-mono text-xs">{presetLabels[p]}</span>,
          title: `${presetLabels[p]} speed`,
        }))}
        value={preset}
        onChange={setPreset}
        compact
        className="w-80 xl:w-96"
      />
          </div>
  );
};

/** One button that cycles through the presets, for narrow layouts where a row is too costly. */
export const SpeedCycleButton = ({ className }: { className?: string }) => {
  const { preset, setPreset } = useSpeed();
  const next = speedPresets[(speedPresets.indexOf(preset) + 1) % speedPresets.length];
  return (
    <Button
      data-tour="speed"
      size="icon"
      className={cn("w-14 shrink-0 font-mono", className)}
      onClick={() => setPreset(next)}
      aria-label={`Speed ${presetLabels[preset]}. Tap for ${presetLabels[next]}`}
      title={HELP}
    >
      {presetLabels[preset]}
    </Button>
  );
};
