import { ChevronDownIcon, TimerIcon } from "@radix-ui/react-icons";
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
 * Desktop header: the name and complexity on one row, a one-line summary, and
 * the long explanation folded away so the bars get the height.
 */
export const Header = ({ className }: { className?: string }) => {
  const activeAlgorithm = useStore((s) => s.activeAlgorithm);
  const { title, shortDescription, longDescription } = sortingAlgorithms[activeAlgorithm];

  return (
    <header
      key={activeAlgorithm}
      className={cn(
        "flex flex-col gap-3 text-foreground animate-in fade-in duration-300 motion-reduce:animate-none",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h1 className="font-display text-display font-semibold">{title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Complexity />
          <ShareButton />
        </div>
      </div>
      <p className="max-w-3xl text-foreground/80">{shortDescription}</p>
      <details className="group max-w-3xl">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-sm text-sm font-semibold text-foreground/80 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
          How it works
          <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
        </summary>
        <p className="mt-2 text-foreground/80">{longDescription}</p>
      </details>
    </header>
  );
};
