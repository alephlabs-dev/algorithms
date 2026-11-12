import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { localized } from "@/i18n";
import { useStore } from "@/store";
import { navigate } from "@/urlSync";
import { Button } from "@/components/ui/button";
import { PageLink } from "@/components/PageLink";
import { Field } from "@/components/Settings/Field";
import { pathfindingLinkFor } from "./toPathfinding";

const text = localized({
  en: {
    label: "Solve it",
    link: "Find a path",
    help: "Opens this maze, finished, in Pathfinding, where a search looks for the way from one corner to the other.",
  },
  es: {
    label: "Resuélvelo",
    link: "Buscar un camino",
    help: "Abre este laberinto, terminado, en Búsqueda de caminos, donde una búsqueda encuentra el camino de una esquina a la otra.",
  },
});

/** The finished maze on stage, opened in pathfinding: a real link, which the app opens like any other. */
export const SolveLink = () => {
  const inputs = useStore(
    useShallow((s) => ({
      mazes: s.mazes,
      algorithm: s.pathfinding.algorithm,
      speedPreset: s.speedPreset,
      isMobile: s.isMobile,
      isPortrait: s.isPortrait,
      stageAspect: s.stageAspect,
    })),
  );
  const { route, search } = useMemo(() => pathfindingLinkFor(inputs), [inputs]);
  return (
    <Field label={text.label} help={text.help}>
      <Button asChild variant="secondary" className="self-start">
        <PageLink to={route} search={search} onNavigate={navigate}>
          {text.link}
        </PageLink>
      </Button>
    </Field>
  );
};
