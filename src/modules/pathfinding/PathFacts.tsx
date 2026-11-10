import { pathAlgorithms, pathTraits } from "./algorithms";
import { useStore } from "@/store";
import { FactLine } from "@/components/ui/fact-line";

/** What the search on stage guarantees and how fast it is, in one line. */
export const PathFacts = () => {
  const algorithm = useStore((s) => s.pathfinding.algorithm);
  return <FactLine facts={[...pathTraits(algorithm).split(" · "), pathAlgorithms[algorithm].timeComplexity]} />;
};
