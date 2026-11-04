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
    {/* Radix reads the accessible name from the thumb, which has role="slider". */}
    <SliderPrimitive.Thumb aria-label={ariaLabel} aria-valuetext={ariaValueText} className="block h-3.5 w-3.5 rounded-full bg-foreground shadow-md ring-2 ring-background transition-transform duration-150 group-hover:scale-125 active:scale-125 motion-reduce:transition-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
