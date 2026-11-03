import { useStore } from "@/store";
import { Slider } from "../ui/slider";

const MAX_DELAY = 1000;

export const SpeedSlider = () => {
  const speed = useStore((s) => s.speed);
  const setSpeed = useStore((s) => s.setSpeed);

  return (
    <div className="flex items-center gap-4 text-foreground w-full">
      <h3 className="font-semibold">Speed</h3>
      {/* Right means faster, so the slider value is the inverse of the delay. */}
      <Slider
        aria-label="Speed"
        value={[MAX_DELAY - speed]}
        min={0}
        max={MAX_DELAY}
        step={1}
        onValueChange={([value]) => setSpeed(MAX_DELAY - value)}
      />
    </div>
  );
};
