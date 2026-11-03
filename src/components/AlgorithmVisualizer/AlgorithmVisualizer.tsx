import { useStore } from "@/store";
import { Item } from "./Item";
import { cn } from "@/utils/cn";
import { useMemo, useRef } from "react";
import { useResizeObserver } from "usehooks-ts";
import { useShallow } from "zustand/react/shallow";

export const AlgorithmVisualizer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Tracks the container height so bars rescale when the window is resized.
  const { height: itemMaxHeight = 0 } = useResizeObserver({ ref: containerRef });

  const { items, activeItems, doneItems, tempItems, arrayId, displayMode } =
    useStore(
      useShallow((s) => ({
        items: s.items,
        activeItems: s.activeItems,
        doneItems: s.doneItems,
        tempItems: s.tempItems,
        arrayId: s.arrayId,
        displayMode: s.displayMode,
      }))
    );

  const activeSet = useMemo(() => new Set(activeItems), [activeItems]);
  const doneSet = useMemo(() => new Set(doneItems), [doneItems]);
  const tempSet = useMemo(() => new Set(tempItems), [tempItems]);

  return (
    <div className="border border-accent/50 lg:border-none lg:bg-accent rounded flex items-center justify-center overflow-hidden h-full p-1 md:p-2 lg:p-3 xl:p-8">
      <div
        ref={containerRef}
        className={cn(
          "w-full lg:max-w-4xl flex items-end justify-center md:gap-2 gap-1 lg:gap-3 h-full",
          {
            "items-center": displayMode === "numbers",
          }
        )}
      >
        {items.map((item) => (
          <Item
            key={`${arrayId}-${item}`}
            itemMaxHeight={itemMaxHeight}
            item={item}
            isActive={activeSet.has(item)}
            isDone={doneSet.has(item)}
            isTemp={tempSet.has(item)}
          />
        ))}
      </div>
    </div>
  );
};
