import { cn } from "@/utils/cn";
import { Algorithm } from "@/types";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { Button } from "../ui/button";
import { Title } from "./Title";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";

const algorithms = Object.keys(sortingAlgorithms) as Algorithm[];

export const AlgorithmSelector = () => {
  const { activeAlgorithm, setActiveAlgorithm, isPlaying } = useStore(
    useShallow((s) => ({
      activeAlgorithm: s.activeAlgorithm,
      setActiveAlgorithm: s.setActiveAlgorithm,
      isPlaying: s.isPlaying,
    }))
  );
  const activeIndex = algorithms.indexOf(activeAlgorithm);

  return (
    <div className="flex flex-col gap-4">
      <Title title="Sorting Algorithms" />
      <div className="relative flex flex-col gap-2">
        {/* One shared highlight that slides to the selected algorithm. Each row is
            h-10 plus a gap-2, so row k sits at k × 3rem. */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-10 rounded-sm bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateY(${activeIndex * 3}rem)` }}
        />
        {algorithms.map((algorithm) => (
          <Button
            key={algorithm}
            variant="ghost"
            aria-pressed={activeAlgorithm === algorithm}
            className={cn(
              "relative h-10 px-4 text-base text-foreground justify-start hover:bg-accent hover:text-foreground transition-colors",
              {
                "text-background hover:bg-transparent hover:text-background":
                  activeAlgorithm === algorithm,
              }
            )}
            onClick={() => setActiveAlgorithm(algorithm)}
            disabled={isPlaying}
          >
            {sortingAlgorithms[algorithm].title}
          </Button>
        ))}
      </div>
    </div>
  );
};
