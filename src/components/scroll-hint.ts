// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Backtracking hints move into its manifest.
import { backtrackingProblems } from "@/modules/backtracking/algorithms";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the DP hints move into its manifest.
import { dpProblems } from "@/modules/dp/algorithms";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Fourier hints move into its manifest.
import { fourierSeries } from "@/modules/fourier/algorithms";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Graphs hints move into its manifest.
import { graphAlgorithms } from "@/modules/graphs/algorithms";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Mazes hints move into its manifest.
import { mazeAlgorithms } from "@/modules/mazes/algorithms";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Pathfinding hints move into its manifest.
import { pathAlgorithms } from "@/modules/pathfinding/algorithms";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Sorting hints move into its manifest.
import { sortingAlgorithms } from "@/modules/sorting/algorithms";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Data structures hints move into its manifest.
import { structures } from "@/modules/structures/algorithms";
import { localized } from "@/i18n";
import type { AlgorithmOf, ModuleId, RacingModule, Route } from "@/routes";

const text = localized({
  en: {
    sorting: "About sorting algorithms",
    pathfinding: "About pathfinding algorithms",
    graphs: "About graph algorithms",
    fourier: "About Fourier series",
    structures: "About these data structures",
    dp: "About dynamic programming",
    backtracking: "About backtracking",
    mazes: "About maze generation",
    dpRace: "What memoizing saves",
    dpHowItWorks: (title: string) => `How ${title.toLowerCase()} works`,
    structure: (title: string) => `How the ${title} works`,
    balancing: "Why balancing matters",
    series: ({ title }: { title: string; named: string }) => `How the ${title} works`,
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
    backtracking: "Sobre el backtracking",
    mazes: "Sobre la generación de laberintos",
    dpRace: "Lo que ahorra memorizar",
    dpHowItWorks: (named) => `Cómo funciona ${named}`,
    structure: (named) => `Cómo funciona ${named}`,
    balancing: "Por qué importa balancear",
    series: ({ named }) => `${/^l(o|a)s /.test(named) ? "Cómo funcionan" : "Cómo funciona"} ${named}`,
    algorithm: (title) => `Cómo funciona ${title}`,
    race: "Cómo funciona la carrera",
  },
});

type Hints<M extends ModuleId> = {
  /** "About …": the start page's hint just takes you to the article. */
  start: string;
  /** Other pages' hints name the article's first explanation ("How X works"), so they open it too. */
  algorithm: (algorithm: AlgorithmOf<M>) => string;
} & (M extends RacingModule ? { race: string } : unknown);

/** Every module's hints, one per page. A module or a race page without one fails the typecheck. */
const HINTS: { [M in ModuleId]: Hints<M> } = {
  sorting: {
    start: text.sorting,
    algorithm: (algorithm) => text.algorithm(sortingAlgorithms[algorithm].title),
    race: text.race,
  },
  pathfinding: {
    start: text.pathfinding,
    algorithm: (algorithm) => text.algorithm(pathAlgorithms[algorithm].named),
    race: text.race,
  },
  graphs: {
    start: text.graphs,
    algorithm: (algorithm) => text.algorithm(graphAlgorithms[algorithm].named),
    race: text.race,
  },
  fourier: { start: text.fourier, algorithm: (algorithm) => text.series(fourierSeries[algorithm]) },
  structures: {
    start: text.structures,
    algorithm: (algorithm) => text.structure(structures[algorithm].named),
    race: text.balancing,
  },
  dp: { start: text.dp, algorithm: (algorithm) => text.dpHowItWorks(dpProblems[algorithm].named), race: text.dpRace },
  backtracking: { start: text.backtracking, algorithm: (algorithm) => backtrackingProblems[algorithm].howItWorks },
  mazes: {
    start: text.mazes,
    algorithm: (algorithm) => text.algorithm(mazeAlgorithms[algorithm].named),
    race: text.race,
  },
};

/** The modules with hints, from the table. */
export const hintModules = Object.keys(HINTS) as ModuleId[];

/** Whether tapping the hint also opens the explanation it names: everywhere but a start page (and the landing page). */
export const hintOpens = (route: Route): boolean => route.page === "algorithm" || route.page === "race";

/** The hint's text on a page. The landing page reads like sorting's start page. */
export const hintLabel = (route: Route): string => {
  if (route.page === "home") return HINTS.sorting.start;
  const hints = HINTS[route.module] as { start: string; algorithm: (algorithm: string) => string; race?: string };
  if (route.page === "algorithm") return hints.algorithm(route.algorithm);
  return route.page === "race" ? hints.race! : hints.start;
};
