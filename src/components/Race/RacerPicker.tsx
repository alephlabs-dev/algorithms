import { useShallow } from "zustand/react/shallow";
import { algorithmGroups } from "@/consts/algorithmGroups";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { MAX_RACERS, MIN_RACERS, useStore } from "@/store";
import type { Algorithm } from "@/types";
import { cn } from "@/utils/cn";
import { ListItem } from "../ui/list-item";
import { SectionLabel } from "../ui/section-label";

const algorithms = algorithmGroups.flatMap((g) => g.algorithms);
const shortName = (a: Algorithm) =>
  sortingAlgorithms[a].title.replace(/ Sort$/, "").replace("Cocktail Shaker", "Cocktail");

const useRacers = () =>
  useStore(
    useShallow((s) => ({
      selected: s.raceAlgorithms,
      toggle: s.toggleRaceAlgorithm,
    }))
  );

/** Why a racer can't be toggled right now, if it can't. */
const blockedReason = (selected: Algorithm[], algorithm: Algorithm) => {
  const isOn = selected.includes(algorithm);
  if (isOn && selected.length <= MIN_RACERS) return `At least ${MIN_RACERS} racers`;
  if (!isOn && selected.length >= MAX_RACERS) return `Up to ${MAX_RACERS} racers: remove one first`;
  return undefined;
};

/** Sidebar list (desktop): the same grouped list as single view, with checkboxes. */
export const RacerList = () => {
  const { selected, toggle } = useRacers();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between px-3">
        <SectionLabel>Racers</SectionLabel>
        <span className="font-mono text-xs text-foreground/60">
          {selected.length}/{MAX_RACERS}
        </span>
      </div>
      {algorithmGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <SectionLabel className="px-3">{group.label}</SectionLabel>
          {group.algorithms.map((algorithm) => {
            const reason = blockedReason(selected, algorithm);
            return (
              <ListItem
                key={algorithm}
                checkbox
                selected={selected.includes(algorithm)}
                disabled={reason !== undefined}
                title={reason}
                onClick={() => toggle(algorithm)}
              >
                {sortingAlgorithms[algorithm].title}
              </ListItem>
            );
          })}
        </div>
      ))}
      {selected.length >= MAX_RACERS && (
        <p className="px-3 text-xs text-foreground/70">Up to {MAX_RACERS} racers. Remove one to add another.</p>
      )}
    </div>
  );
};

/** One scrollable row of chips (phones and tablets). */
export const RacerChips = ({ className }: { className?: string }) => {
  const { selected, toggle } = useRacers();
  return (
    <div
      role="group"
      aria-label={`Racers, pick ${MIN_RACERS} to ${MAX_RACERS}`}
      className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6", className)}
    >
      {algorithms.map((algorithm) => {
        const isOn = selected.includes(algorithm);
        const reason = blockedReason(selected, algorithm);
        return (
          <button
            key={algorithm}
            type="button"
            aria-pressed={isOn}
            disabled={reason !== undefined}
            title={reason}
            onClick={() => toggle(algorithm)}
            className={cn(
              "flex h-11 shrink-0 items-center rounded-full border-2 px-4 text-sm transition-colors disabled:opacity-40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
              isOn
                ? "border-foreground bg-foreground font-semibold text-background disabled:opacity-100"
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
