import { useShallow } from "zustand/react/shallow";
import { algorithmGroups } from "@/consts/algorithmGroups";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { ListItem } from "./ui/list-item";
import { SectionLabel } from "./ui/section-label";

/** The nine algorithms, grouped by how they scale. */
export const AlgorithmList = () => {
  const { activeAlgorithm, setActiveAlgorithm } = useStore(
    useShallow((s) => ({
      activeAlgorithm: s.activeAlgorithm,
      setActiveAlgorithm: s.setActiveAlgorithm,
    }))
  );

  return (
    <nav aria-label="Algorithms" className="flex flex-col gap-4">
      {algorithmGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <SectionLabel className="flex justify-between px-3">
            {group.label}
            <span className="font-mono normal-case tracking-normal">{group.hint}</span>
          </SectionLabel>
          {group.algorithms.map((algorithm) => (
            <ListItem
              key={algorithm}
              selected={algorithm === activeAlgorithm}
              onClick={() => algorithm !== activeAlgorithm && setActiveAlgorithm(algorithm)}
            >
              {sortingAlgorithms[algorithm].title}
            </ListItem>
          ))}
        </div>
      ))}
    </nav>
  );
};

const shortName = (title: string) => title.replace(/ Sort$/, "").replace("Cocktail Shaker", "Cocktail");

/**
 * Every algorithm as a chip in one scrollable row (phones and tablets): visibly
 * tappable, one tap to switch, in the same order and look as the race chips.
 */
export const AlgorithmChips = ({ className }: { className?: string }) => {
  const { activeAlgorithm, setActiveAlgorithm } = useStore(
    useShallow((s) => ({ activeAlgorithm: s.activeAlgorithm, setActiveAlgorithm: s.setActiveAlgorithm }))
  );
  const algorithms = algorithmGroups.flatMap((g) => g.algorithms);

  return (
    <div
      role="radiogroup"
      aria-label="Algorithm"
      className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6", className)}
    >
      {algorithms.map((algorithm) => {
        const selected = algorithm === activeAlgorithm;
        return (
          <button
            key={algorithm}
            type="button"
            role="radio"
            aria-checked={selected}
            // Keep the selected chip in view when the row loads scrolled.
            ref={selected ? (el) => el?.scrollIntoView({ block: "nearest", inline: "nearest" }) : undefined}
            onClick={() => !selected && setActiveAlgorithm(algorithm)}
            className={cn(
              "flex h-11 shrink-0 items-center rounded-full border-2 px-4 text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
              selected
                ? "border-foreground bg-foreground font-semibold text-background"
                : "border-line text-foreground hover:bg-accent"
            )}
          >
            {shortName(sortingAlgorithms[algorithm].title)}
          </button>
        );
      })}
    </div>
  );
};
