import { TimerIcon } from "@radix-ui/react-icons";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { useStore } from "@/store";
import { Badge } from "./ui/badge";
import { cn } from "@/utils/cn";

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
