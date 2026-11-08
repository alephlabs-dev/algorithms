import { backtrackingProblems } from "@/consts/backtracking";
import { dpProblems } from "@/consts/dp";
import { fourierSeries } from "@/consts/fourierSeries";
import { graphAlgorithms } from "@/consts/graphAlgorithms";
import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { structures } from "@/consts/structures";
import { localized } from "@/i18n";
import type { Route } from "@/routes";

const text = localized({
  en: {
    sorting: "About sorting algorithms",
    pathfinding: "About pathfinding algorithms",
    graphs: "About graph algorithms",
    fourier: "About Fourier series",
    structures: "About these data structures",
    dp: "About dynamic programming",
    backtracking: "About backtracking",
    dpRace: "What memoizing saves",
    dpProblem: (title: string) => `How ${title.toLowerCase()} works`,
    structure: (title: string) => `How the ${title} works`,
    structureRace: "Why balancing matters",
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
    dpRace: "Lo que ahorra memorizar",
    dpProblem: (named) => `Cómo funciona ${named}`,
    structure: (named) => `Cómo funciona ${named}`,
    structureRace: "Por qué importa balancear",
    series: ({ named }) => `${/^l(o|a)s /.test(named) ? "Cómo funcionan" : "Cómo funciona"} ${named}`,
    algorithm: (title) => `Cómo funciona ${title}`,
    race: "Cómo funciona la carrera",
  },
});

type Hint<K extends Route["kind"]> = {
  label: (route: Extract<Route, { kind: K }>) => string;
  /** Whether tapping the hint also opens the explanation it names. */
  opens: boolean;
};

/**
 * Every route kind's hint. A module's start page says "About …": the hint just
 * takes you to the article. Every other page's hint names the article's first
 * explanation ("How X works", "Why balancing matters"), so it opens that one too.
 * A route kind without an entry fails the typecheck.
 */
const HINTS: { [K in Route["kind"]]: Hint<K> } = {
  home: { label: () => text.sorting, opens: false },
  sorting: { label: () => text.sorting, opens: false },
  pathfinding: { label: () => text.pathfinding, opens: false },
  graphs: { label: () => text.graphs, opens: false },
  fourier: { label: () => text.fourier, opens: false },
  structures: { label: () => text.structures, opens: false },
  dp: { label: () => text.dp, opens: false },
  backtracking: { label: () => text.backtracking, opens: false },
  dpRace: { label: () => text.dpRace, opens: true },
  dpProblem: { label: (route) => text.dpProblem(dpProblems[route.algorithm].named), opens: true },
  structure: { label: (route) => text.structure(structures[route.algorithm].named), opens: true },
  structureRace: { label: () => text.structureRace, opens: true },
  series: { label: (route) => text.series(fourierSeries[route.algorithm]), opens: true },
  graph: { label: (route) => text.algorithm(graphAlgorithms[route.algorithm].named), opens: true },
  race: { label: () => text.race, opens: true },
  pathRace: { label: () => text.race, opens: true },
  graphRace: { label: () => text.race, opens: true },
  path: { label: (route) => text.algorithm(pathAlgorithms[route.algorithm].named), opens: true },
  algorithm: { label: (route) => text.algorithm(sortingAlgorithms[route.algorithm].title), opens: true },
  backtrackingProblem: {
    label: (route) => backtrackingProblems[route.algorithm].howItWorks,
    opens: true,
  },
};

export const hintFor = <K extends Route["kind"]>(route: Extract<Route, { kind: K }>): Hint<K> => HINTS[route.kind as K];

/** Every route kind, from the table. */
export const hintKinds = Object.keys(HINTS) as Route["kind"][];

/** The hint's text on a route. */
export const hintLabel = (route: Route): string => hintFor(route).label(route as never);
