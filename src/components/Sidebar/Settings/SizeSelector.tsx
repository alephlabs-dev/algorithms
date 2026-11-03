import { cn } from "@/utils/cn";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { TooltipInfo } from "./TooltipInfo";
import { Button } from "@/components/ui/button";
import { sizes } from "@/consts/sizesMap";

export const SizeSelector = () => {
  const {
    size: activeSize,
    setSize,
    isPlaying,
    displayMode,
  } = useStore(
    useShallow((s) => ({
      size: s.size,
      setSize: s.setSize,
      isPlaying: s.isPlaying,
      displayMode: s.displayMode,
    }))
  );

  const handleSizeChange = (size: number) => {
    if (size !== activeSize) setSize(size);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-foreground text-lg">Array Size</h3>
        <TooltipInfo
          title="Array Size"
          content="How many items to sort. Small arrays are easier to follow; large ones show how the algorithms scale. Numbers mode is limited to 20 items."
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {sizes.map((size) => (
          <Button
            key={size}
            variant="ghost"
            className={cn(
              "px-4 py-2 capitalize text-white hover:bg-accent hover:text-white h-auto border-2 border-line",
              {
                "bg-accent border-foreground/70 hover:bg-accent/90 hover:text-white":
                  size === activeSize,
              }
            )}
            onClick={() => handleSizeChange(size)}
            disabled={
              isPlaying || (displayMode === "numbers" && size > 20)
            }
          >
            {size}
          </Button>
        ))}
      </div>
    </div>
  );
};
