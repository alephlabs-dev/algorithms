import { cn } from "@/utils/cn";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { displayModes } from "@/consts/displayModes";
import type { DisplayMode } from "@/types";

export const DisplayModeSelector = () => {
  const { displayMode, setDisplayMode, isPlaying } = useStore(
    useShallow((s) => ({
      displayMode: s.displayMode,
      setDisplayMode: s.setDisplayMode,
      isPlaying: s.isPlaying,
    }))
  );

  // The store caps the array size when switching to numbers mode.
  const handleDisplayModeChange = (mode: DisplayMode) => {
    if (mode !== displayMode) setDisplayMode(mode);
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium text-foreground text-lg">Display Mode</h3>
      <div className="grid grid-cols-2 gap-2">
        {displayModes.map((mode) => (
          <Button
            key={mode}
            variant="ghost"
            className={cn(
              "px-4 py-2 capitalize text-white hover:bg-accent hover:text-white h-auto border-2 border-line",
              {
                "bg-accent border-foreground/70 hover:bg-accent/90 hover:text-white":
                  mode === displayMode,
              }
            )}
            onClick={() => handleDisplayModeChange(mode)}
            disabled={isPlaying}
          >
            {mode}
          </Button>
        ))}
      </div>
    </div>
  );
};
