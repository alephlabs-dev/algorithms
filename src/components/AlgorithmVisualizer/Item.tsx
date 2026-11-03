import { cn } from "@/utils/cn";
import { useStore } from "@/store";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { memo, useEffect, useRef } from "react";
import { calculateItemHeight } from "./barHeight";

type Props = {
  item: number;
  /** Position in the array; used to know how far the item moved. */
  index: number;
  isActive: boolean;
  isDone: boolean;
  isTemp: boolean;
  isPivot: boolean;
  /** Outside the range being worked on. */
  isDimmed: boolean;
  /** This item jumps over its neighbours in this frame. */
  hop: boolean;
  /** The run just finished. */
  celebrate: boolean;
  itemMaxHeight: number;
};

// How far a compared bar lifts, as a share of the container.
const ACTIVE_LIFT = 0.06;

export const Item = memo(
  ({
    item,
    index,
    isActive,
    isDone,
    isTemp,
    isPivot,
    isDimmed,
    hop,
    celebrate,
    itemMaxHeight,
  }: Props) => {
    const speed = useStore((s) => s.speed);
    const displayMode = useStore((s) => s.displayMode);
    const size = useStore((s) => s.size);
    const reduceMotion = useReducedMotion();
    const [scope, animate] = useAnimate<HTMLDivElement>();

    // Animation lasts ~80% of the frame delay (0–1000ms), so faster speeds animate faster.
    const animationDuration = Math.max(0.05, (speed / 1000) * 0.8);
    const isBars = displayMode === "bars";

    // Swap arc: hop higher the further the item travels.
    const previousIndex = useRef(index);
    useEffect(() => {
      const distance = Math.abs(index - previousIndex.current);
      previousIndex.current = index;
      if (!hop || distance === 0 || reduceMotion) return;
      const height = isBars
        ? itemMaxHeight * (0.06 + 0.02 * Math.min(distance, 3))
        : itemMaxHeight * 0.12;
      animate(
        scope.current,
        { y: [0, -height, 0] },
        { duration: animationDuration, ease: "easeInOut" }
      );
    }, [index, hop, reduceMotion, isBars, itemMaxHeight, animate, scope, animationDuration]);

    // Victory wave: a small staggered hop, left to right, when the run finishes.
    const wasCelebrating = useRef(celebrate);
    useEffect(() => {
      const started = celebrate && !wasCelebrating.current;
      wasCelebrating.current = celebrate;
      if (!started || reduceMotion) return;
      animate(
        scope.current,
        { y: [0, -itemMaxHeight * 0.05, 0] },
        { duration: 0.4, delay: index * 0.025, ease: "easeOut" }
      );
    }, [celebrate, reduceMotion, itemMaxHeight, index, animate, scope]);

    const animationState = isDone ? "done" : isActive ? "active" : "inactive";
    const transition = {
      // Framer ignores duration/bounce if stiffness/damping/mass are also set.
      type: "spring" as const,
      bounce: 0.3,
      duration: animationDuration,
    };

    return (
      // Three layers so each motion stays independent: the outer one slides to
      // the new position, the middle one hops, the inner one lifts and colors.
      <motion.div
        layout
        transition={transition}
        className={cn("w-full relative", { "z-10": hop })}
      >
        <div ref={scope}>
          <motion.div
            className={cn(
              "rounded-xs md:rounded-sm grid place-items-center bg-foreground origin-center w-full transition-[background-color,opacity] duration-200",
              {
                "bg-primary": isDone,
                "bg-tertiary": isTemp,
                "bg-secondary": isActive,
                "aspect-square": !isBars,
                "opacity-40": isDimmed,
                "ring-2 ring-white ring-offset-2 ring-offset-accent": isPivot,
              }
            )}
            style={{ height: isBars ? calculateItemHeight(item, itemMaxHeight) : "auto" }}
            variants={{
              active: {
                y: isBars ? -itemMaxHeight * ACTIVE_LIFT : -itemMaxHeight / 8,
              },
              done: { y: 0 },
              inactive: { y: 0 },
            }}
            transition={transition}
            animate={animationState}
          >
            {!isBars && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn("text-xs text-background font-semibold", {
                  "text-white": isDone || isActive,
                  "md:text-base": size === 10,
                })}
              >
                {item}
              </motion.span>
            )}
          </motion.div>
        </div>
      </motion.div>
    );
  }
);
