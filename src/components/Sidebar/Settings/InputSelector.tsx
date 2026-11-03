import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { inputOrders } from "@/consts/inputOrders";
import { useStore } from "@/store";
import type { InputOrder } from "@/types";
import { cn } from "@/utils/cn";
import { TooltipInfo } from "./TooltipInfo";

export const InputSelector = () => {
  const { inputOrder, setInputOrder, isPlaying } = useStore(
    useShallow((s) => ({
      inputOrder: s.inputOrder,
      setInputOrder: s.setInputOrder,
      isPlaying: s.isPlaying,
    }))
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-foreground text-lg">Input</h3>
        <TooltipInfo
          title="Input"
          content="How the array starts out. Try Sorted or Nearly sorted to see best cases, and Reversed for worst cases."
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(inputOrders) as InputOrder[]).map((order) => (
          <Button
            key={order}
            variant="ghost"
            className={cn(
              "px-4 py-2 text-white hover:bg-accent hover:text-white h-auto border-2 border-line",
              {
                "bg-accent border-foreground/70 hover:bg-accent/90 hover:text-white":
                  order === inputOrder,
              }
            )}
            onClick={() => setInputOrder(order)}
            disabled={isPlaying}
          >
            {inputOrders[order].label}
          </Button>
        ))}
      </div>
    </div>
  );
};
