import { TimerIcon } from "@radix-ui/react-icons";
import { sortingAlgorithms } from "./algorithms";
import { useStore } from "@/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { localized } from "@/i18n";

const text = localized({
  en: { time: "Time", best: "best", average: "average", worst: "worst" },
  es: { time: "Tiempo", best: "mejor", average: "promedio", worst: "peor" },
});

/** Best / average / worst time complexity for an algorithm. */
export const Complexity = ({ className }: { className?: string }) => {
  const activeAlgorithm = useStore((s) => s.sorting.algorithm);
  const { timeComplexity } = sortingAlgorithms[activeAlgorithm];
  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
      <span className="flex items-center gap-1.5 text-foreground/70">
        <TimerIcon className="h-4 w-4" /> {text.time}
      </span>
      {(["best", "average", "worst"] as const).map((key) => (
        <Badge key={key} className="gap-1.5 font-normal">
          <span className="capitalize text-foreground/70">{text[key]}</span>
          <span className="font-mono">{timeComplexity[key]}</span>
        </Badge>
      ))}
    </div>
  );
};
