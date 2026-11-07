import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { formatStepsPerSecond, presetLabels, speedPresets, type SpeedPreset } from "@/utils/speed";
import { Button } from "../ui/button";
import { SegmentedControl } from "../ui/segmented";
import { localized } from "@/i18n";

const text = localized({
  en: {
    help: "1× is a comfortable pace for this run; it adapts to its size.",
    now: (sps: string) => `Now ${sps} steps per second.`,
    speed: "Speed",
    presetSpeed: (preset: string) => `${preset} speed`,
    cycle: (preset: string, next: string) => `Speed ${preset}. Tap for ${next}`,
  },
  es: {
    help: "1× es un ritmo cómodo para esta ejecución; se adapta a su tamaño.",
    now: (sps) => `Ahora ${sps} pasos por segundo.`,
    speed: "Velocidad",
    presetSpeed: (preset) => `Velocidad ${preset}`,
    cycle: (preset, next) => `Velocidad ${preset}. Toca para ${next}`,
  },
});

const useSpeed = () =>
  useStore(
    useShallow((s) => ({ preset: s.speedPreset, speed: s.speed, setPreset: s.setSpeedPreset }))
  );

const HELP = text.help;

/** Speed presets relative to a pace picked for each run. Wide layouts. */
export const SpeedControl = ({ className }: { className?: string }) => {
  const { preset, speed, setPreset } = useSpeed();
  return (
    <div data-tour="speed" className={cn("flex items-center gap-3", className)} title={`${HELP} ${text.now(formatStepsPerSecond(speed))}`}>
      <SegmentedControl<SpeedPreset>
        label={text.speed}
        options={speedPresets.map((p) => ({
          value: p,
          label: <span className="font-mono text-xs">{presetLabels[p]}</span>,
          title: text.presetSpeed(presetLabels[p]),
        }))}
        value={preset}
        onChange={setPreset}
        compact
        className="w-64 xl:w-72"
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
      aria-label={text.cycle(presetLabels[preset], presetLabels[next])}
      title={HELP}
    >
      {presetLabels[preset]}
    </Button>
  );
};
