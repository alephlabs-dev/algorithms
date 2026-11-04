import { useShallow } from "zustand/react/shallow";
import { algorithmGroups } from "@/consts/algorithmGroups";
import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import type { PathAlgorithm } from "@/pathfinding";
import { MAX_RACERS, MIN_RACERS, useStore } from "@/store";
import { ListItem } from "../ui/list-item";
import { SectionLabel } from "../ui/section-label";

const useRacers = () =>
  useStore(
    useShallow((s) => ({
      isPath: s.module === "pathfinding",
      selected: s.raceAlgorithms,
      toggle: s.toggleRaceAlgorithm,
      pathSelected: s.pathRaceAlgorithms,
      togglePath: s.togglePathRacer,
    })),
  );

/** Why a racer can't be toggled right now, if it can't. */
const blockedReason = <T,>(selected: T[], algorithm: T) => {
  const isOn = selected.includes(algorithm);
  if (isOn && selected.length <= MIN_RACERS) return `At least ${MIN_RACERS} racers`;
  if (!isOn && selected.length >= MAX_RACERS) return `Up to ${MAX_RACERS} racers: remove one first`;
  return undefined;
};

/** Sidebar list (desktop): the same grouped list as single view, with checkboxes. */
export const RacerList = ({ showHeader = true }: { showHeader?: boolean }) => {
  const { isPath, selected, toggle, pathSelected, togglePath } = useRacers();
  if (isPath) {
    return (
      <div className="flex flex-col gap-1">
        {showHeader && (
          <div className="flex items-baseline justify-between px-3 pb-1">
            <SectionLabel>Racers</SectionLabel>
            <span className="font-mono text-xs text-foreground/60">
              {pathSelected.length}/{MAX_RACERS}
            </span>
          </div>
        )}
        {(Object.keys(pathAlgorithms) as PathAlgorithm[]).map((algorithm) => {
          const reason = blockedReason(pathSelected, algorithm);
          return (
            <ListItem
              key={algorithm}
              checkbox
              selected={pathSelected.includes(algorithm)}
              disabled={reason !== undefined}
              title={reason}
              onClick={() => togglePath(algorithm)}
            >
              {pathAlgorithms[algorithm].title}
            </ListItem>
          );
        })}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {/* Hidden where the surrounding sheet already has a "Racers" title. */}
      {showHeader && (
        <div className="flex items-baseline justify-between px-3">
          <SectionLabel>Racers</SectionLabel>
          <span className="font-mono text-xs text-foreground/60">
            {selected.length}/{MAX_RACERS}
          </span>
        </div>
      )}
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
