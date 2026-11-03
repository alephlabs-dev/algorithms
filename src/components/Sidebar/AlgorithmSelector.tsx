import { motion } from "motion/react";
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

  return (
    <div className="flex flex-col gap-4">
      <Title title="Sorting Algorithms" />
      <div className="flex flex-col gap-2">
        {algorithms.map((algorithm) => (
          <Button
            key={algorithm}
            variant="ghost"
            className={cn(
              "relative px-4 py-2 capitalize text-base text-foreground justify-start hover:bg-accent hover:text-foreground h-auto",
              {
                "text-background hover:bg-transparent hover:text-background":
                  activeAlgorithm === algorithm,
              }
            )}
            onClick={() => setActiveAlgorithm(algorithm)}
            disabled={isPlaying}
          >
            {/* One shared background that slides to the selected algorithm. */}
            {activeAlgorithm === algorithm && (
              <motion.span
                layoutId="active-algorithm"
                className="absolute inset-0 rounded-sm bg-primary"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative">{algorithm} Sort</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
