import { ResetIcon } from "@radix-ui/react-icons";
import { useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { ordinal } from "@/utils/ordinal";
import { Button } from "../ui/button";

/** A finishing position, with the winner in the accent color. */
export const PlaceBadge = ({ place }: { place: number }) => (
  <span
    className={cn("rounded-full px-2 py-0.5 font-mono text-xs font-semibold", {
      "bg-primary text-background": place === 1,
      "bg-foreground/15": place !== 1,
    })}
  >
    {ordinal(place)}
  </span>
);

/** The podium card over the lanes once everyone has finished. Can be folded to look at the lanes. */
export const ResultsOverlay = ({ children, onReplay }: { children: ReactNode; onReplay: () => void }) => {
  const [folded, setFolded] = useState(false);

  if (folded) {
    return (
      <Button
        className="absolute bottom-3 right-3 shadow-lg animate-in fade-in duration-200 motion-reduce:animate-none"
        onClick={() => setFolded(false)}
      >
        Show results
      </Button>
    );
  }

  return (
    <div className="absolute inset-0 grid place-items-center bg-background/60 p-4 backdrop-blur-[2px] animate-in fade-in duration-300 motion-reduce:animate-none">
      <section
        role="status"
        aria-label="Race results"
        className="flex w-full max-w-md flex-col gap-4 rounded-3xl border border-edge bg-surface p-6 shadow-2xl"
      >
        <h2 className="text-xl font-semibold">Results</h2>
        {children}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setFolded(true)}>
            Hide
          </Button>
          <Button variant="primary" size="sm" onClick={onReplay}>
            <ResetIcon /> Race again
          </Button>
        </div>
      </section>
    </div>
  );
};
