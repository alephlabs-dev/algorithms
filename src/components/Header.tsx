import { ChevronDownIcon, TimerIcon } from "@radix-ui/react-icons";
import { useId, useState } from "react";
import { useStore } from "@/store";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { cn } from "@/utils/cn";
import { ShareButton } from "./ShareButton";
import { Badge } from "./ui/badge";

/** Best / average / worst time complexity for an algorithm. */
export const Complexity = ({ className }: { className?: string }) => {
  const activeAlgorithm = useStore((s) => s.activeAlgorithm);
  const { timeComplexity } = sortingAlgorithms[activeAlgorithm];
  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
      <span className="flex items-center gap-1.5 text-foreground/70">
        <TimerIcon className="h-4 w-4" /> Time
      </span>
      {(["best", "average", "worst"] as const).map((key) => (
        <Badge key={key} className="gap-1.5 font-normal">
          <span className="capitalize text-foreground/70">{key}</span>
          <span className="font-mono">{timeComplexity[key]}</span>
        </Badge>
      ))}
    </div>
  );
};

/**
 * Desktop header, in three levels: the name and a one-line summary; a row of
 * facts and actions (complexity, How it works, Copy link); and the long
 * explanation, which opens smoothly below that row.
 */
export const Header = ({ className }: { className?: string }) => {
  const activeAlgorithm = useStore((s) => s.activeAlgorithm);
  // Remounting per algorithm closes the explanation and replays the fade-in.
  return <HeaderContent key={activeAlgorithm} className={className} />;
};

const HeaderContent = ({ className }: { className?: string }) => {
  const activeAlgorithm = useStore((s) => s.activeAlgorithm);
  const { title, shortDescription, longDescription } = sortingAlgorithms[activeAlgorithm];
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <header
      className={cn("flex flex-col text-foreground animate-in fade-in duration-300 motion-reduce:animate-none", className)}
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-semibold">{title}</h1>
        <p className="max-w-3xl text-foreground/80">{shortDescription}</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Complexity />
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 rounded-sm text-sm font-semibold text-foreground/80 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
        >
          How it works
          <ChevronDownIcon
            className={cn("h-4 w-4 transition-transform duration-300 motion-reduce:transition-none", { "rotate-180": open })}
          />
        </button>
        <div className="ml-auto">
          <ShareButton labelClassName="hidden xl:inline" />
        </div>
      </div>

      {/* Animating grid rows from 0fr to 1fr opens the text to its natural height. */}
      <div
        id={panelId}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out motion-reduce:transition-none",
          open ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="max-w-3xl border-l-2 border-line pl-4 text-foreground/80">{longDescription}</p>
        </div>
      </div>
    </header>
  );
};
