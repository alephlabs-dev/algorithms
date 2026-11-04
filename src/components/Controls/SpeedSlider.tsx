import { useStore } from "@/store";
import { formatStepsPerSecond } from "@/utils/speed";
import { Slider } from "../ui/slider";

const RESOLUTION = 1000;

export const SpeedSlider = () => {
  const speed = useStore((s) => s.speed);
  const setSpeed = useStore((s) => s.setSpeed);

  return (
    <div className="flex items-center gap-4 text-foreground w-full">
      <h3 className="text-sm font-semibold">Speed</h3>
      <Slider
        aria-label="Speed"
        aria-valuetext={`${formatStepsPerSecond(speed)} steps per second`}
        value={[Math.round(speed * RESOLUTION)]}
        min={0}
        max={RESOLUTION}
        step={1}
        onValueChange={([value]) => setSpeed(value / RESOLUTION)}
      />
      <span className="min-w-20 whitespace-nowrap text-right font-mono text-xs">
        {formatStepsPerSecond(speed)} steps/s
      </span>
    </div>
  );
};
