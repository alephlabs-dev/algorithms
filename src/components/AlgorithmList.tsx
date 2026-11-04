import { useShallow } from "zustand/react/shallow";
import { algorithmGroups } from "@/consts/algorithmGroups";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { useStore } from "@/store";
import { ListItem } from "./ui/list-item";
import { SectionLabel } from "./ui/section-label";

/** The nine algorithms, grouped by how they scale. */
export const AlgorithmList = ({ onPick }: { onPick?: () => void }) => {
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
              onClick={() => {
                if (algorithm !== activeAlgorithm) setActiveAlgorithm(algorithm);
                onPick?.();
              }}
            >
              {sortingAlgorithms[algorithm].title}
            </ListItem>
          ))}
        </div>
      ))}
    </nav>
  );
};
