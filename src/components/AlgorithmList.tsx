import { useShallow } from "zustand/react/shallow";
import { algorithmGroups } from "@/consts/algorithmGroups";
import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import type { PathAlgorithm } from "@/pathfinding";
import { useStore } from "@/store";
import { ListItem } from "./ui/list-item";
import { SectionLabel } from "./ui/section-label";

/** This module's algorithms: sorting grouped by how they scale, or the pathfinding searches. */
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

  if (!isSorting) {
    return (
      <nav aria-label="Algorithms" className="flex flex-col gap-1">
        {(Object.keys(pathAlgorithms) as PathAlgorithm[]).map((algorithm) => (
          <ListItem
            key={algorithm}
            selected={algorithm === pathAlgorithm}
            onClick={() => {
              if (algorithm !== pathAlgorithm) setPathAlgorithm(algorithm);
              onPick?.();
            }}
          >
            {pathAlgorithms[algorithm].title}
          </ListItem>
        ))}
      </nav>
    );
  }

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
