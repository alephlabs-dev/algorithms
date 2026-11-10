import type { BacktrackingProblem } from "./backtracking/types";
import type { DpAlgorithm } from "./dp/types";
import type { FourierAlgorithm } from "./fourier/types";
import type { StructureAlgorithm } from "./structures/types";
import type { GraphAlgorithm } from "./graphs/types";
import type { MazeAlgorithm } from "./mazes/types";
import type { PathAlgorithm } from "./pathfinding/types";
import type { Algorithm } from "./types";
import { lang, LANG_PREFIX, stripLang, type Lang } from "./i18n";

/** Where the site is published; canonical URLs, the sitemap and social cards use it. */
export const SITE_URL = "https://algorithms-aleph.vercel.app";

/** The modules the app has. */
export type ModuleId = "sorting" | "pathfinding" | "graphs" | "fourier" | "structures" | "dp" | "backtracking" | "mazes";

type Pages = {
  /** The start page's path; the module's other pages hang under it. */
  base: string;
  /** Each algorithm's slug (in backtracking, each problem's): /sorting/quick-sort. */
  slugs: Record<string, string>;
  /** Whether the module has a race page, at <base>/race. */
  race: boolean;
};

/**
 * Every module's pages: a start page, one page per algorithm, and a race page
 * if it has one. Adding a module or an algorithm means editing this table only.
 */
export const modulePages = {
  sorting: {
    base: "/sorting",
    slugs: {
      selection: "selection-sort",
      insertion: "insertion-sort",
      bubble: "bubble-sort",
      cocktail: "cocktail-shaker-sort",
      shell: "shell-sort",
      quick: "quick-sort",
      merge: "merge-sort",
      heap: "heap-sort",
      radix: "radix-sort",
    } satisfies Record<Algorithm, string>,
    race: true,
  },
  pathfinding: {
    base: "/pathfinding",
    slugs: {
      bfs: "breadth-first-search",
      dfs: "depth-first-search",
      dijkstra: "dijkstra",
      astar: "a-star",
      greedy: "greedy-best-first-search",
    } satisfies Record<PathAlgorithm, string>,
    race: true,
  },
  graphs: {
    base: "/graphs",
    slugs: {
      bfs: "breadth-first-search",
      dfs: "depth-first-search",
      dijkstra: "dijkstra",
      prim: "prim",
      kruskal: "kruskal",
      topo: "topological-sort",
    } satisfies Record<GraphAlgorithm, string>,
    race: true,
  },
  fourier: {
    base: "/fourier",
    slugs: {
      square: "square-wave",
      sawtooth: "sawtooth-wave",
      triangle: "triangle-wave",
      epicycles: "epicycles",
    } satisfies Record<FourierAlgorithm, string>,
    race: false,
  },
  structures: {
    base: "/structures",
    slugs: {
      bst: "binary-search-tree",
      avl: "avl-tree",
      heap: "min-heap",
      chaining: "hash-table-chaining",
      probing: "hash-table-linear-probing",
    } satisfies Record<StructureAlgorithm, string>,
    race: true,
  },
  dp: {
    base: "/dynamic-programming",
    slugs: {
      edit: "edit-distance",
      lcs: "longest-common-subsequence",
      knapsack: "knapsack",
    } satisfies Record<DpAlgorithm, string>,
    race: true,
  },
  backtracking: {
    base: "/backtracking",
    slugs: {
      queens: "n-queens",
      sudoku: "sudoku",
    } satisfies Record<BacktrackingProblem, string>,
    race: false,
  },
  mazes: {
    base: "/mazes",
    slugs: {
      dfs: "dfs",
      prim: "prim",
      kruskal: "kruskal",
    } satisfies Record<MazeAlgorithm, string>,
    race: false,
  },
} as const satisfies Record<ModuleId, Pages>;

const MODULES = Object.keys(modulePages) as ModuleId[];

/** The algorithms a module has pages for (in backtracking, the problems). */
export type AlgorithmOf<M extends ModuleId> = keyof (typeof modulePages)[M]["slugs"] & string;

/** The modules with a race page. */
export type RacingModule = { [M in ModuleId]: (typeof modulePages)[M]["race"] extends true ? M : never }[ModuleId];

/** The kinds of page every module has (the race only in some). */
export type ModulePage = "start" | "algorithm" | "race";

/** A module's pages. */
export type ModuleRoute<M extends ModuleId = ModuleId> = M extends ModuleId
  ?
      | { module: M; page: "start" }
      | { module: M; page: "algorithm"; algorithm: AlgorithmOf<M> }
      | (M extends RacingModule ? { module: M; page: "race" } : never)
  : never;

/** Every page the site has: the landing page, or a module's page. Settings (size, input, speed, seed…) stay in the query string. */
export type Route = { page: "home" } | ModuleRoute;

export const HOME: Route = { page: "home" };

/** A module's page without checking its algorithm or race against the module; callers that build one generically use it. */
export const moduleRoute = (module: ModuleId, page: ModulePage, algorithm?: string): ModuleRoute =>
  (page === "algorithm" ? { module, page, algorithm } : { module, page }) as ModuleRoute;

export const routePath = (route: Route): string => {
  if (route.page === "home") return "/";
  const { base, slugs } = modulePages[route.module];
  if (route.page === "start") return base;
  if (route.page === "race") return `${base}/race`;
  return `${base}/${(slugs as Record<string, string>)[route.algorithm]}`;
};

/** A page's path in a language: /sorting in English, /es/sorting in Spanish. */
export const pathIn = (route: Route, language: Lang): string => {
  const path = routePath(route);
  if (language === "en") return path;
  return LANG_PREFIX[language] + (path === "/" ? "" : path);
};

/** A page's path in this page load's language, for links. */
export const href = (route: Route): string => pathIn(route, lang);

/** The page a path points at, in either language, or null for paths the site doesn't have. */
export const routeFromPath = (pathname: string): Route | null => {
  const path = stripLang(pathname).replace(/\/+$/, "") || "/";
  if (path === "/") return HOME;
  for (const module of MODULES) {
    const { base, slugs, race } = modulePages[module] as Pages;
    if (path === base) return moduleRoute(module, "start");
    if (!path.startsWith(`${base}/`)) continue;
    const slug = path.slice(base.length + 1);
    if (race && slug === "race") return moduleRoute(module, "race");
    const algorithm = Object.keys(slugs).find((id) => slugs[id] === slug);
    return algorithm ? moduleRoute(module, "algorithm", algorithm) : null;
  }
  return null;
};

/** All pages, for prerendering and the sitemap: home, then each module's start page, algorithms and race. */
export const allRoutes: Route[] = [
  HOME,
  ...MODULES.flatMap((module) => {
    const { slugs, race } = modulePages[module] as Pages;
    return [
      moduleRoute(module, "start"),
      ...Object.keys(slugs).map((algorithm) => moduleRoute(module, "algorithm", algorithm)),
      ...(race ? [moduleRoute(module, "race")] : []),
    ];
  }),
];

/** Which module a page belongs to, if any (the landing page belongs to none). */
export const moduleOf = (route: Route): ModuleId | null => (route.page === "home" ? null : route.module);

/**
 * Modules whose text is in Spanish. Their /es pages are indexed and linked
 * with hreflang. A new module that isn't translated yet still gets /es pages,
 * in English and marked noindex, until it's added here.
 */
export const TRANSLATED_MODULES: ReadonlySet<ModuleId> = new Set([
  "sorting",
  "pathfinding",
  "graphs",
  "structures",
  "dp",
  "fourier",
  "backtracking",
  "mazes",
]);

/** Whether a page has a Spanish version worth indexing. The landing page does. */
export const isTranslated = (route: Route, translated: ReadonlySet<ModuleId> = TRANSLATED_MODULES): boolean => {
  const module = moduleOf(route);
  return module === null || translated.has(module);
};
