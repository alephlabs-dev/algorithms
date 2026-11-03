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
      "relative flex w-full touch-none select-none items-center py-5 -my-5",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-line">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    {/* Radix reads the accessible name from the thumb, which has role="slider". */}
    <SliderPrimitive.Thumb aria-label={ariaLabel} aria-valuetext={ariaValueText} className="cursor-pointer block h-4 w-4 rounded-full border-2 border-background hover:border-primary bg-primary shadow-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
