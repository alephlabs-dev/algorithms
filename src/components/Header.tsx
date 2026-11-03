import { useStore } from "@/store";

import { Badge } from "./ui/badge";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { TimerIcon } from "@radix-ui/react-icons";

export const Header = () => {
  const activeAlgorithm = useStore((s) => s.activeAlgorithm);

  return (
    <div className="flex flex-col w-full gap-4 lg:gap-6 xl:gap-8 text-foreground p-8 md:p-0">
      {/* Keyed by algorithm so the text fades in whenever it changes. */}
      <div
        key={activeAlgorithm}
        className="flex flex-col gap-4 lg:gap-6 xl:gap-8 animate-in fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none"
      >
        <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold">
          {sortingAlgorithms[activeAlgorithm].title}
        </h1>
        <p className="xl:text-lg">
          {sortingAlgorithms[activeAlgorithm].longDescription}
        </p>
      </div>

      {/* A label for the badges, styled so it doesn't read as a button. */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-accent md:bg-transparent p-4 md:p-0 rounded-sm md:w-fit">
        <h2 className="flex items-center gap-2 text-sm font-medium text-foreground/80">
          <TimerIcon className="w-4 h-4" /> Time complexity
        </h2>
        <div className="flex items-center gap-2 lg:gap-4">
          <Badge className="flex flex-col md:flex-row w-1/3 md:w-auto md:gap-2">
            Best
            <span className="font-normal">
              {sortingAlgorithms[activeAlgorithm].timeComplexity.best}
            </span>
          </Badge>
          <Badge className="flex flex-col md:flex-row w-1/3 md:w-auto md:gap-2">
            Average
            <span className="font-normal">
              {sortingAlgorithms[activeAlgorithm].timeComplexity.average}
            </span>
          </Badge>
          <Badge className="flex flex-col md:flex-row w-1/3 md:w-auto md:gap-2">
            Worst
            <span className="font-normal">
              {sortingAlgorithms[activeAlgorithm].timeComplexity.worst}
            </span>
          </Badge>
        </div>
      </div>
    </div>
  );
};
