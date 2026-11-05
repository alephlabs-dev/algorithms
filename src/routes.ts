import type { DpAlgorithm } from "./dp/types";
import type { FourierAlgorithm } from "./fourier/types";
import type { StructureAlgorithm } from "./structures/types";
import type { GraphAlgorithm } from "./graphs/types";
import type { PathAlgorithm } from "./pathfinding/types";
import type { Algorithm } from "./types";
import { lang, LANG_PREFIX, stripLang, type Lang } from "./i18n";

/** Where the site is published; canonical URLs, the sitemap and social cards use it. */
export const SITE_URL = "https://algorithms-aleph.vercel.app";

/** URL slug for each algorithm, e.g. /sorting/quick-sort. */
export const algorithmSlugs: Record<Algorithm, string> = {
  selection: "selection-sort",
  insertion: "insertion-sort",
  bubble: "bubble-sort",
  cocktail: "cocktail-shaker-sort",
  shell: "shell-sort",
  quick: "quick-sort",
  merge: "merge-sort",
  heap: "heap-sort",
  radix: "radix-sort",
};

/** URL slug for each pathfinding algorithm, e.g. /pathfinding/dijkstra. */
export const pathSlugs: Record<PathAlgorithm, string> = {
  bfs: "breadth-first-search",
  dfs: "depth-first-search",
  dijkstra: "dijkstra",
  astar: "a-star",
  greedy: "greedy-best-first-search",
};

/** URL slug for each graph algorithm, e.g. /graphs/dijkstra. */
export const graphSlugs: Record<GraphAlgorithm, string> = {
  bfs: "breadth-first-search",
  dfs: "depth-first-search",
  dijkstra: "dijkstra",
  prim: "prim",
  kruskal: "kruskal",
  topo: "topological-sort",
};

/** URL slug for each Fourier series, e.g. /fourier/square-wave. */
export const seriesSlugs: Record<FourierAlgorithm, string> = {
  square: "square-wave",
  sawtooth: "sawtooth-wave",
  triangle: "triangle-wave",
  epicycles: "epicycles",
};

/** URL slug for each data structure, e.g. /structures/avl-tree. */
export const structureSlugs: Record<StructureAlgorithm, string> = {
  bst: "binary-search-tree",
  avl: "avl-tree",
  heap: "min-heap",
  chaining: "hash-table-chaining",
  probing: "hash-table-linear-probing",
};

/** URL slug for each dynamic programming problem, e.g. /dynamic-programming/edit-distance. */
export const dpSlugs: Record<DpAlgorithm, string> = {
  edit: "edit-distance",
  lcs: "longest-common-subsequence",
  knapsack: "knapsack",
};

/** Every page the site has. Settings (size, input, speed, seed…) stay in the query string. */
export type Route =
  /** The landing page. */
  | { kind: "home" }
  /** A module's own page: its visualizer with the default algorithm, and an index of the module. */
  | { kind: "sorting" }
  | { kind: "pathfinding" }
  | { kind: "graphs" }
  | { kind: "algorithm"; algorithm: Algorithm }
  | { kind: "race" }
  | { kind: "path"; algorithm: PathAlgorithm }
  | { kind: "pathRace" }
  | { kind: "graph"; algorithm: GraphAlgorithm }
  | { kind: "graphRace" }
  | { kind: "fourier" }
  | { kind: "series"; algorithm: FourierAlgorithm }
  | { kind: "structures" }
  | { kind: "structure"; algorithm: StructureAlgorithm }
  | { kind: "structureRace" }
  | { kind: "dp" }
  | { kind: "dpProblem"; algorithm: DpAlgorithm }
  | { kind: "dpRace" };

export const routePath = (route: Route): string => {
  if (route.kind === "home") return "/";
  if (route.kind === "sorting") return "/sorting";
  if (route.kind === "pathfinding") return "/pathfinding";
  if (route.kind === "graphs") return "/graphs";
  if (route.kind === "graph") return `/graphs/${graphSlugs[route.algorithm]}`;
  if (route.kind === "graphRace") return "/graphs/race";
  if (route.kind === "fourier") return "/fourier";
  if (route.kind === "series") return `/fourier/${seriesSlugs[route.algorithm]}`;
  if (route.kind === "structures") return "/structures";
  if (route.kind === "structure") return `/structures/${structureSlugs[route.algorithm]}`;
  if (route.kind === "structureRace") return "/structures/race";
  if (route.kind === "dp") return "/dynamic-programming";
  if (route.kind === "dpRace") return "/dynamic-programming/race";
  if (route.kind === "dpProblem") return `/dynamic-programming/${dpSlugs[route.algorithm]}`;
  if (route.kind === "race") return "/sorting/race";
  if (route.kind === "pathRace") return "/pathfinding/race";
  if (route.kind === "path") return `/pathfinding/${pathSlugs[route.algorithm]}`;
  return `/sorting/${algorithmSlugs[route.algorithm]}`;
};

/** A page's path in a language: /sorting in English, /es/sorting in Spanish. */
export const pathIn = (route: Route, language: Lang): string => {
  const path = routePath(route);
  if (language === "en") return path;
  return LANG_PREFIX[language] + (path === "/" ? "" : path);
}

/** A page's path in this page load's language, for links. */
export const href = (route: Route): string => pathIn(route, lang);

/** The page a path points at, in either language, or null for paths the site doesn't have. */
export const routeFromPath = (pathname: string): Route | null => {
  const path = stripLang(pathname).replace(/\/+$/, "") || "/";
  if (path === "/") return { kind: "home" };
  if (path === "/sorting") return { kind: "sorting" };
  if (path === "/pathfinding") return { kind: "pathfinding" };
  if (path === "/graphs") return { kind: "graphs" };
  if (path === "/graphs/race") return { kind: "graphRace" };
  if (path === "/fourier") return { kind: "fourier" };
  if (path === "/structures") return { kind: "structures" };
  if (path === "/structures/race") return { kind: "structureRace" };
  if (path === "/dynamic-programming") return { kind: "dp" };
  if (path === "/dynamic-programming/race") return { kind: "dpRace" };
  const dpMatch = /^\/dynamic-programming\/([a-z-]+)$/.exec(path);
  if (dpMatch) {
    const found = Object.entries(dpSlugs).find(([, slug]) => slug === dpMatch[1]);
    return found ? { kind: "dpProblem", algorithm: found[0] as DpAlgorithm } : null;
  }
  const structureMatch = /^\/structures\/([a-z-]+)$/.exec(path);
  if (structureMatch) {
    const found = Object.entries(structureSlugs).find(([, slug]) => slug === structureMatch[1]);
    return found ? { kind: "structure", algorithm: found[0] as StructureAlgorithm } : null;
  }
  const seriesMatch = /^\/fourier\/([a-z-]+)$/.exec(path);
  if (seriesMatch) {
    const found = Object.entries(seriesSlugs).find(([, slug]) => slug === seriesMatch[1]);
    return found ? { kind: "series", algorithm: found[0] as FourierAlgorithm } : null;
  }
  const graphMatch = /^\/graphs\/([a-z-]+)$/.exec(path);
  if (graphMatch) {
    const found = Object.entries(graphSlugs).find(([, slug]) => slug === graphMatch[1]);
    return found ? { kind: "graph", algorithm: found[0] as GraphAlgorithm } : null;
  }
  if (path === "/sorting/race") return { kind: "race" };
  if (path === "/pathfinding/race") return { kind: "pathRace" };
  const pathMatch = /^\/pathfinding\/([a-z-]+)$/.exec(path);
  if (pathMatch) {
    const found = Object.entries(pathSlugs).find(([, slug]) => slug === pathMatch[1]);
    return found ? { kind: "path", algorithm: found[0] as PathAlgorithm } : null;
  }
  const match = /^\/sorting\/([a-z-]+)$/.exec(path);
  if (!match) return null;
  const entry = Object.entries(algorithmSlugs).find(([, slug]) => slug === match[1]);
  return entry ? { kind: "algorithm", algorithm: entry[0] as Algorithm } : null;
};

/** All pages, for prerendering and the sitemap. */
export const allRoutes: Route[] = [
  { kind: "home" },
  { kind: "sorting" },
  ...(Object.keys(algorithmSlugs) as Algorithm[]).map((algorithm) => ({ kind: "algorithm" as const, algorithm })),
  { kind: "race" },
  { kind: "pathfinding" },
  ...(Object.keys(pathSlugs) as PathAlgorithm[]).map((algorithm) => ({ kind: "path" as const, algorithm })),
  { kind: "pathRace" },
  { kind: "graphs" },
  ...(Object.keys(graphSlugs) as GraphAlgorithm[]).map((algorithm) => ({ kind: "graph" as const, algorithm })),
  { kind: "graphRace" },
  { kind: "fourier" },
  ...(Object.keys(seriesSlugs) as FourierAlgorithm[]).map((algorithm) => ({ kind: "series" as const, algorithm })),
  { kind: "structures" },
  ...(Object.keys(structureSlugs) as StructureAlgorithm[]).map((algorithm) => ({ kind: "structure" as const, algorithm })),
  { kind: "structureRace" },
  { kind: "dp" },
  ...(Object.keys(dpSlugs) as DpAlgorithm[]).map((algorithm) => ({ kind: "dpProblem" as const, algorithm })),
  { kind: "dpRace" },
];

/** Which module a page belongs to, if any (the landing page belongs to none). */
export const moduleOf = (route: Route): "sorting" | "pathfinding" | "graphs" | "fourier" | "structures" | "dp" | null => {
  if (route.kind === "home") return null;
  if (route.kind === "dp" || route.kind === "dpProblem" || route.kind === "dpRace") return "dp";
  if (route.kind === "structures" || route.kind === "structure" || route.kind === "structureRace") return "structures";
  if (route.kind === "fourier" || route.kind === "series") return "fourier";
  if (route.kind === "graphs" || route.kind === "graph" || route.kind === "graphRace") return "graphs";
  return route.kind === "pathfinding" || route.kind === "path" || route.kind === "pathRace" ? "pathfinding" : "sorting";
};

/**
 * Modules whose text is in Spanish. Their /es pages are indexed and linked
 * with hreflang; the others exist under /es in English, marked noindex,
 * until their sub-issue of #36 adds them here.
 */
const TRANSLATED: ReadonlySet<NonNullable<ReturnType<typeof moduleOf>>> = new Set(["sorting", "pathfinding", "graphs", "structures", "dp"]);

/** Whether a page has a Spanish version worth indexing. The landing page does. */
export const isTranslated = (route: Route): boolean => {
  const module = moduleOf(route);
  return module === null || TRANSLATED.has(module);
};
