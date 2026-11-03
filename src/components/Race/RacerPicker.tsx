import { CheckIcon } from "@radix-ui/react-icons";
import { useShallow } from "zustand/react/shallow";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { MAX_RACERS, MIN_RACERS, useStore } from "@/store";
import type { Algorithm } from "@/types";
import { cn } from "@/utils/cn";
import { Button } from "../ui/button";
import { Title } from "../Sidebar/Title";

const algorithms = Object.keys(sortingAlgorithms) as Algorithm[];
const shortName = (a: Algorithm) =>
  sortingAlgorithms[a].title.replace(/ Sort$/, "").replace("Cocktail Shaker", "Cocktail");

const useRacers = () =>
  useStore(
    useShallow((s) => ({
      selected: s.raceAlgorithms,
      toggle: s.toggleRaceAlgorithm,
      isPlaying: s.isPlaying,
    }))
  );

const canToggle = (selected: Algorithm[], algorithm: Algorithm) =>
  selected.includes(algorithm) ? selected.length > MIN_RACERS : selected.length < MAX_RACERS;

/** Sidebar list (desktop): the same list as single view, but several can be picked. */
export const RacerList = () => {
  const { selected, toggle, isPlaying } = useRacers();
  return (
    <div className="flex flex-col gap-4">
      <Title title={`Racers (${selected.length}/${MAX_RACERS})`} />
      <div className="flex flex-col gap-2">
        {algorithms.map((algorithm) => {
          const isOn = selected.includes(algorithm);
          return (
            <Button
              key={algorithm}
              variant="ghost"
              aria-pressed={isOn}
              disabled={isPlaying || !canToggle(selected, algorithm)}
              onClick={() => toggle(algorithm)}
              className="h-10 justify-start gap-3 px-4 text-base text-foreground"
            >
              <span
                aria-hidden
                className={cn(
                  "grid h-4 w-4 place-items-center rounded-sm border border-foreground/40",
                  { "border-primary bg-primary text-background": isOn }
                )}
              >
                {isOn && <CheckIcon className="h-3.5 w-3.5" />}
              </span>
              {sortingAlgorithms[algorithm].title}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

/** One scrollable row of chips (phones and tablets). */
export const RacerChips = ({ className }: { className?: string }) => {
  const { selected, toggle, isPlaying } = useRacers();
  return (
    <div
      role="group"
      aria-label={`Racers, pick ${MIN_RACERS} to ${MAX_RACERS}`}
      className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0", className)}
    >
      {algorithms.map((algorithm) => {
        const isOn = selected.includes(algorithm);
        return (
          <button
            key={algorithm}
            aria-pressed={isOn}
            disabled={isPlaying || !canToggle(selected, algorithm)}
            onClick={() => toggle(algorithm)}
            className={cn(
              "shrink-0 rounded-full border h-11 px-4 text-xs font-medium transition-colors disabled:opacity-40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
              isOn
                ? "border-primary bg-primary text-background disabled:opacity-100"
                : "border-line text-foreground"
            )}
          >
            {shortName(algorithm)}
          </button>
        );
      })}
    </div>
  );
};
