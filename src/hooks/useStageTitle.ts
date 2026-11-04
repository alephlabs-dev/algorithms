import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { useStore } from "@/store";

/** The name of whatever is on stage, sorting or pathfinding. */
export const useStageTitle = () =>
  useStore((s) =>
    s.module === "pathfinding" ? pathAlgorithms[s.pathAlgorithm].title : sortingAlgorithms[s.activeAlgorithm].title
  );
