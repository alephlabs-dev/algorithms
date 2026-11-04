import { useShallow } from "zustand/react/shallow";
import { useModuleUI } from "@/modules";
import { useStore } from "@/store";

/** What's on stage, explained: the algorithm (with its facts) or how the race works. */
export const StageInfo = ({ compact }: { compact?: boolean }) => {
  const { about, race, Facts } = useModuleUI();
  const { isRace, shortDescription, longDescription } = useStore(
    useShallow((s) => ({ isRace: s.view === "race", ...about(s) })),
  );
  if (isRace && race) return <p className="text-foreground/80">{race.description}</p>;
  return (
    <>
      <p className="text-foreground/80">{shortDescription}</p>
      <p className={compact ? "text-foreground/80" : "text-sm text-foreground/70"}>{longDescription}</p>
      <Facts />
    </>
  );
};
