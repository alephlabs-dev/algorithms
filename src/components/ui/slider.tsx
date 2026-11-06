import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/utils/cn";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, "aria-label": ariaLabel, "aria-valuetext": ariaValueText, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      // The padding/negative margin pair gives a 44px touch area (4px track + 2×20px) without changing layout height.
      "group relative flex w-full cursor-pointer touch-none select-none items-center py-5 -my-5",
      className
    )}
    {...props}
  >
    {/* Video-timeline style: a light fill on a visible track that thickens on hover. */}
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-line transition-[height] duration-150 group-hover:h-2 motion-reduce:transition-none">
      <SliderPrimitive.Range className="absolute h-full bg-foreground" />
    </SliderPrimitive.Track>
    {/* Radix reads the accessible name from the thumb, which has role="slider"; it doesn't say when it's disabled. */}
    <SliderPrimitive.Thumb aria-label={ariaLabel} aria-valuetext={ariaValueText} aria-disabled={props.disabled || undefined} className="tap-target relative block h-3.5 w-3.5 rounded-full bg-foreground shadow-md ring-2 ring-background transition-transform duration-150 group-hover:scale-125 active:scale-125 motion-reduce:transition-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

type StepSliderProps<T extends number> = {
  /** Accessible name. */
  label: string;
  /** The steps, in order. */
  values: readonly T[];
  value: T;
  /** Called on every step while dragging, so the change shows live. */
  onChange: (value: T) => void;
  /** What a screen reader says for a step ("40 items"). */
  valueText: (value: T) => string;
  className?: string;
};

// The thumb is 14px wide and Radix keeps it inside the track, so its centre runs from 7px to 100% − 7px.
const tickLeft = (fraction: number) => `calc(7px + ${fraction} * (100% - 14px))`;

/**
 * A slider that snaps to a few fixed values, with the current one always shown
 * beside it, out from under the finger. One value only: it shows, disabled.
 */
const StepSlider = <T extends number>({ label, values, value, onChange, valueText, className }: StepSliderProps<T>) => {
  const index = Math.max(0, values.indexOf(value));
  const last = values.length - 1;
  return (
    <div className={cn("flex items-center gap-4 pb-2", className)}>
      <div className="relative flex grow items-center">
        <Slider
          aria-label={label}
          aria-valuetext={valueText(values[index])}
          value={[index]}
          min={0}
          max={Math.max(last, 1)}
          step={1}
          disabled={last === 0}
          onValueChange={([i]) => values[i] !== undefined && values[i] !== value && onChange(values[i])}
          className="data-disabled:cursor-not-allowed data-disabled:opacity-50"
        />
        {/* One tick per step, so the stops are visible before dragging. */}
        {last > 0 && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-full mt-1.5 h-1">
            {values.map((v, i) => (
              <span
                key={v}
                className={cn("absolute h-1 w-px -translate-x-1/2", i <= index ? "bg-foreground/70" : "bg-line")}
                style={{ left: tickLeft(i / last) }}
              />
            ))}
          </div>
        )}
      </div>
      <output aria-hidden className="w-9 shrink-0 text-right font-mono text-sm tabular-nums text-foreground">
        {values[index]}
      </output>
    </div>
  );
};

export { Slider, StepSlider };
