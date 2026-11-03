import { cn } from "@/utils/cn";
import { useStore } from "@/store";
import { motion } from "framer-motion";
import { memo } from "react";
import { MAX_ITEM } from "@/utils/generateItems";

type Props = {
  item: number;
  isActive: boolean;
  isDone: boolean;
  isTemp: boolean;
  itemMaxHeight: number;
};

const calculateItemHeight = (item: number, itemMaxHeight: number) => {
  return ((item / MAX_ITEM) * itemMaxHeight) / 2;
};

export const Item = memo(
  ({ item, isActive, isDone, isTemp, itemMaxHeight }: Props) => {
    const speedRef = useStore((s) => s.speedRef);
    const displayMode = useStore((s) => s.displayMode);
    const size = useStore((s) => s.size);

    // Animation lasts ~80% of the step delay (0–1000ms), so faster speeds animate faster.
    // Read at render: items re-render whenever their highlight changes, which is right around when they move.
    const animationDuration = Math.max(0.05, (speedRef.current / 1000) * 0.8);

    const itemStyles = {
      height:
        displayMode === "bars"
          ? calculateItemHeight(item, itemMaxHeight)
          : "auto",
    };

    const animationState = isDone ? "done" : isActive ? "active" : "inactive";

    return (
      <motion.div
        // `layout` animates the bar sliding to its new position when the array is reordered.
        layout
        className={cn(
          "rounded-sm md:rounded grid place-items-center bg-foreground origin-center w-full",
          {
            "bg-primary": isDone,
            "bg-tertiary": isTemp,
            "bg-secondary": isActive,
            "aspect-square": displayMode === "numbers",
          }
        )}
        style={itemStyles}
        variants={{
          active: {
            y: displayMode === "bars" ? -itemMaxHeight / 2 : -itemMaxHeight / 8,
          },
          done: { y: 0 },
          inactive: { y: 0 },
        }}
        transition={{
          // Framer ignores duration/bounce if stiffness/damping/mass are also set.
          type: "spring",
          bounce: 0.3,
          duration: animationDuration,
        }}
        animate={animationState}
      >
        {displayMode === "numbers" && (
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
    );
  }
);
