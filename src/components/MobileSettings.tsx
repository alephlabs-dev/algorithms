import { BarChartIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/utils/cn";
import type { DisplayMode, InputOrder } from "@/types";
import { displayModes } from "@/consts/displayModes";
import { inputOrders } from "@/consts/inputOrders";
import { MAX_MOBILE_SIZE, sizes } from "@/consts/sizesMap";

export const MobileSettings = () => {
  const {
    displayMode,
    setDisplayMode,
    setSize,
    size: activeSize,
    isMobile,
    isPlaying,
    isRace,
    inputOrder,
    setInputOrder,
  } = useStore(
    useShallow((s) => ({
      displayMode: s.displayMode,
      setDisplayMode: s.setDisplayMode,
      setSize: s.setSize,
      size: s.size,
      isMobile: s.isMobile,
      isPlaying: s.isPlaying,
      isRace: s.view === "race",
      inputOrder: s.inputOrder,
      setInputOrder: s.setInputOrder,
    }))
  );

  // The store caps the array size when switching to numbers mode.
  const handleDisplayModeChange = (mode: DisplayMode) => {
    if (mode !== displayMode) setDisplayMode(mode);
  };

  const handleSizeChange = (size: number) => {
    if (size !== activeSize) setSize(size);
  };

  return (
    <div className="flex lg:hidden flex-col gap-2">
      <div className="flex items-center justify-between">
        {/* Race lanes always draw bars. */}
        <div className={cn("rounded-sm flex items-center overflow-hidden", { invisible: isRace })}>
          {displayModes.map((mode) => (
            <Button
              key={mode}
              className={cn(
                "p-2 border-2 border-r-0 border-accent/50 bg-background rounded-none h-10 w-10 active:bg-accent hover:bg-accent last:border-r-2",
                {
                  "bg-accent": displayMode === mode,
                  "text-xs font-light": mode === "numbers",
                }
              )}
              onClick={() => handleDisplayModeChange(mode)}
              disabled={isPlaying}
            >
              {mode === "bars" ? <BarChartIcon /> : 123}
            </Button>
          ))}
        </div>
        <div className="rounded-sm flex items-center overflow-hidden">
          {sizes
            .filter((size) => size <= MAX_MOBILE_SIZE)
            .map((size) => (
              <Button
                key={size}
                className={cn(
                  "p-0 border-2 border-r-0 border-accent/50 bg-background rounded-none w-10 h-10 text-xs active:bg-accent hover:bg-accent last:border-r-2",
                  {
                    "bg-accent": size === activeSize,
                  }
                )}
                onClick={() => handleSizeChange(size)}
                disabled={
                  isPlaying ||
                  (displayMode === "numbers" &&
                    (size > 20 || (isMobile && size > 10)))
                }
              >
                {size}
              </Button>
            ))}
        </div>
      </div>
      <div className="rounded-sm flex items-center overflow-hidden">
        {(Object.keys(inputOrders) as InputOrder[]).map((order) => (
          <Button
            key={order}
            className={cn(
              "flex-1 px-2 border-2 border-r-0 border-accent/50 bg-background rounded-none h-10 text-xs active:bg-accent hover:bg-accent last:border-r-2",
              { "bg-accent": inputOrder === order }
            )}
            onClick={() => setInputOrder(order)}
            disabled={isPlaying}
            aria-pressed={inputOrder === order}
          >
            {inputOrders[order].shortLabel}
          </Button>
        ))}
      </div>
    </div>
  );
};
