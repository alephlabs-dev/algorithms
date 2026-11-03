import { selectFrame, useStore } from "@/store";
import { Item } from "./Item";
import { calculateItemHeight } from "./barHeight";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { useMemo, useRef } from "react";
import { useResizeObserver } from "usehooks-ts";
import { useShallow } from "zustand/react/shallow";

export const AlgorithmVisualizer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Tracks the container height so bars rescale when the window is resized.
  const { height: itemMaxHeight = 0 } = useResizeObserver({ ref: containerRef });

  const { frame, isFinished, arrayId, displayMode } = useStore(
    useShallow((s) => ({
      frame: selectFrame(s),
      isFinished: s.frameIndex > 0 && s.frameIndex === s.frames.length - 1,
      arrayId: s.arrayId,
      displayMode: s.displayMode,
    }))
  );
  const { items, pivot } = frame;

  const activeSet = useMemo(() => new Set(frame.active), [frame]);
  const doneSet = useMemo(() => new Set(frame.done), [frame]);
  const tempSet = useMemo(() => new Set(frame.temp), [frame]);
  const focusSet = useMemo(() => new Set(frame.focus), [frame]);

  return (
    <div className="border border-accent/50 lg:border-none lg:bg-accent rounded flex items-center justify-center overflow-hidden h-full p-1 md:p-2 lg:p-3 xl:p-8">
      <div
        ref={containerRef}
        className={cn(
          "relative w-full lg:max-w-4xl flex items-end justify-center md:gap-2 gap-1 lg:gap-3 h-full",
          {
            "items-center": displayMode === "numbers",
          }
        )}
      >
        {/* Quick sort: a line at the pivot's height shows which bars are smaller. */}
        {pivot !== null && displayMode === "bars" && (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 border-t border-dashed border-white/60 pointer-events-none"
            initial={false}
            animate={{ bottom: calculateItemHeight(pivot, itemMaxHeight) }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          />
        )}
        {items.map((item, index) => (
          <Item
            key={`${arrayId}-${item}`}
            itemMaxHeight={itemMaxHeight}
            item={item}
            index={index}
            isActive={activeSet.has(item)}
            isDone={doneSet.has(item)}
            isTemp={tempSet.has(item)}
            isPivot={item === pivot}
            isDimmed={focusSet.size > 0 && !focusSet.has(item)}
            hop={item === frame.hop}
            celebrate={isFinished}
          />
        ))}
      </div>
    </div>
  );
};
