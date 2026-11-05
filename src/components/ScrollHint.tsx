import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { fourierSeries } from "@/consts/fourierSeries";
import { dpProblems } from "@/consts/dp";
import { structures } from "@/consts/structures";
import { graphAlgorithms } from "@/consts/graphAlgorithms";
import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import type { Route } from "@/routes";
import { cn } from "@/utils/cn";
import { localized } from "@/i18n";

const text = localized({
  en: {
    sorting: "About sorting algorithms",
    pathfinding: "About pathfinding algorithms",
    graphs: "About graph algorithms",
    fourier: "About Fourier series",
    structures: "About these data structures",
    dp: "About dynamic programming",
    dpRace: "What memoizing saves",
    dpProblem: (title: string) => `How ${title.toLowerCase()} works`,
    structure: (title: string) => `How the ${title} works`,
    structureRace: "Why balancing matters",
    series: (title: string) => `How the ${title} works`,
    algorithm: (title: string) => `How ${title} works`,
    race: "How the race works",
  },
  es: {
    sorting: "Sobre los algoritmos de ordenamiento",
    pathfinding: "Sobre los algoritmos de búsqueda de caminos",
    graphs: "Sobre los algoritmos de grafos",
    fourier: "Sobre las series de Fourier",
    structures: "Sobre estas estructuras de datos",
    dp: "Sobre la programación dinámica",
    dpRace: "Lo que ahorra memorizar",
    dpProblem: (title) => `Cómo funciona: ${title}`,
    structure: (title) => `Cómo funciona: ${title}`,
    structureRace: "Por qué importa balancear",
    series: (title) => `Cómo funciona: ${title}`,
    algorithm: (title) => `Cómo funciona ${title}`,
    race: "Cómo funciona la carrera",
  },
});

const labelFor = (route: Route) => {
  switch (route.kind) {
    case "home":
    case "sorting":
      return text.sorting;
    case "pathfinding":
      return text.pathfinding;
    case "graphs":
      return text.graphs;
    case "fourier":
      return text.fourier;
    case "structures":
      return text.structures;
    case "dp":
      return text.dp;
    case "dpRace":
      return text.dpRace;
    case "dpProblem":
      return text.dpProblem(dpProblems[route.algorithm].title);
    case "structure":
      return text.structure(structures[route.algorithm].title);
    case "structureRace":
      return text.structureRace;
    case "series":
      return text.series(fourierSeries[route.algorithm].title);
    case "graph":
      return text.algorithm(graphAlgorithms[route.algorithm].named);
    case "race":
    case "pathRace":
    case "graphRace":
      return text.race;
    case "path":
      return text.algorithm(pathAlgorithms[route.algorithm].named);
    case "algorithm":
      return text.algorithm(sortingAlgorithms[route.algorithm].title);
  }
};

/**
 * Under the dock: says there's more to read below the stage, and takes you
 * there. Fades away once the page has been scrolled.
 */
export const ScrollHint = ({ route, className }: { route: Route; className?: string }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <button
      type="button"
      tabIndex={scrolled ? -1 : undefined}
      aria-hidden={scrolled || undefined}
      onClick={() => {
        const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById("about")?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
      }}
      className={cn(
        "mx-auto flex shrink-0 items-center gap-1.5 rounded-full px-3 text-xs text-foreground/60 transition-[color,opacity] duration-300 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
        scrolled && "pointer-events-none opacity-0",
        className,
      )}
    >
      {labelFor(route)}
      <ChevronDownIcon aria-hidden className="h-4 w-4 animate-nudge motion-reduce:animate-none" />
    </button>
  );
};
