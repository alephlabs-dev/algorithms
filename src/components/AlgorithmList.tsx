import { useShallow } from "zustand/react/shallow";
import { algorithmGroups } from "@/consts/algorithmGroups";
import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import type { PathAlgorithm } from "@/pathfinding";
import { useStore } from "@/store";
import { ListItem } from "./ui/list-item";
import { SectionLabel } from "./ui/section-label";

/** Everything that can go on stage: sorting algorithms grouped by how they scale, then pathfinding. */
export const AlgorithmList = ({ onPick }: { onPick?: () => void }) => {
  const { module, activeAlgorithm, pathAlgorithm, setActiveAlgorithm, setPathAlgorithm } = useStore(
    useShallow((s) => ({
      module: s.module,
      activeAlgorithm: s.activeAlgorithm,
      pathAlgorithm: s.pathAlgorithm,
      setActiveAlgorithm: s.setActiveAlgorithm,
      setPathAlgorithm: s.setPathAlgorithm,
    }))
  );
  const isSorting = module === "sorting";

  return (
    <nav aria-label="Algorithms" className="flex flex-col gap-4">
      <SectionLabel className="px-3 text-foreground">Sorting</SectionLabel>
      {algorithmGroups.map((group) => (
        <div key={group.label} className="-mt-2 flex flex-col gap-1">
          <SectionLabel className="flex justify-between px-3">
            {group.label}
            <span className="font-mono normal-case tracking-normal">{group.hint}</span>
          </SectionLabel>
          {group.algorithms.map((algorithm) => (
            <ListItem
              key={algorithm}
              selected={isSorting && algorithm === activeAlgorithm}
              onClick={() => {
                if (!isSorting || algorithm !== activeAlgorithm) setActiveAlgorithm(algorithm);
                onPick?.();
              }}
            >
              {sortingAlgorithms[algorithm].title}
            </ListItem>
          ))}
        </div>
      ))}
      <div className="flex flex-col gap-1 border-t border-edge pt-4">
        <SectionLabel className="px-3 pb-1 text-foreground">Pathfinding</SectionLabel>
        {(Object.keys(pathAlgorithms) as PathAlgorithm[]).map((algorithm) => (
          <ListItem
            key={algorithm}
            selected={!isSorting && algorithm === pathAlgorithm}
            onClick={() => {
              if (isSorting || algorithm !== pathAlgorithm) setPathAlgorithm(algorithm);
              onPick?.();
            }}
          >
            {pathAlgorithms[algorithm].title}
          </ListItem>
        ))}
      </div>
    </nav>
  );
};
