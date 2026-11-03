import { BarChartIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/utils/cn";
import { DisplayMode } from "@/types";
import { displayModes } from "@/consts/displayModes";
import { sizesMap } from "@/consts/sizesMap";
import { getInitials } from "@/utils/getInitials";

export const MobileSettings = () => {
  const {
    displayMode,
    setDisplayMode,
    setSize,
    size: activeSize,
    isMobile,
    isPlaying,
  } = useStore(
    useShallow((s) => ({
      displayMode: s.displayMode,
      setDisplayMode: s.setDisplayMode,
      setSize: s.setSize,
      size: s.size,
      isMobile: s.isMobile,
      isPlaying: s.isPlaying,
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
    <div className="flex lg:hidden items-center justify-between">
      <div className="rounded flex items-center overflow-hidden">
        {displayModes.map((mode) => (
          <Button
            key={mode}
            className={cn(
              "p-2 border-2 border-r-0 border-accent/50 bg-background rounded-none h-10 w-10 active:bg-accent hover:bg-accent focus:bg-accent last:border-r-2",
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
      <div className="rounded flex items-center overflow-hidden">
        {Object.entries(sizesMap)
          .filter(([size]) => !isMobile || (isMobile && Number(size) < 40))
          .map(([size, label]) => (
            <Button
              key={label}
              className={cn(
                "p-2 border-2 border-r-0 border-accent/50 bg-background rounded-none w-10 h-10 active:bg-accent hover:bg-accent focus:bg-accent last:border-r-2",
                {
                  "bg-accent": Number(size) === activeSize,
                }
              )}
              onClick={() => handleSizeChange(Number(size))}
              disabled={
                isPlaying ||
                (displayMode === "numbers" &&
                  (Number(size) > 20 || (isMobile && Number(size) > 10)))
              }
            >
              {getInitials(label)}
            </Button>
          ))}
      </div>
    </div>
  );
};
