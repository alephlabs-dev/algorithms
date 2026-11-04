import { pathAlgorithms, pathTraits } from "@/consts/pathAlgorithms";
import { useStore } from "@/store";

/** What the search on stage guarantees and how fast it is, in one line. */
export const PathFacts = () => {
  const algorithm = useStore((s) => s.pathAlgorithm);
  return (
    <p className="font-mono text-xs text-foreground/70">
      {pathTraits(algorithm)} · {pathAlgorithms[algorithm].timeComplexity}
    </p>
  );
};
