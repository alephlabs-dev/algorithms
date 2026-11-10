import { lang, LANG_PREFIX, stripLang, type Lang } from "./i18n";
import { manifests } from "./modules/manifests";

/** Where the site is published; canonical URLs, the sitemap and social cards use it. */
export const SITE_URL = "https://algorithms-aleph.vercel.app";

/** The modules the app has: one manifest each, registered in ./modules/manifests.ts. */
export type ModuleId = keyof typeof manifests;

/** Every module, in the order the landing page, the menu and the sitemap list them: the manifests' order. */
export const MODULES = Object.keys(manifests) as ModuleId[];

/** A page's title and description, for search engines and social cards. The title leaves out the site's name, which every page adds. */
export type Meta = { title: string; description: string };

type Pages<Id extends string> = {
  /** The start page's path; the module's other pages hang under it. */
  base: string;
  /** Each algorithm's slug (in backtracking, each problem's): /sorting/quick-sort. */
  slugs: Record<Id, string>;
  /** Whether the module has a race page, at <base>/race. */
  race: boolean;
};

/**
 * What a module tells the rest of the app about itself without React or a browser, so the
 * prerender and e2e can read it in Node (docs/adr/0003): its pages, what search engines and
 * the "About …" hint say on each, and its card on the landing page. Each module declares
 * one in ./modules/<id>/manifest.ts, which imports only Node-safe code (a lint rule checks).
 */
export type ModuleManifest<Id extends string = string> = {
  /** A start page, one page per algorithm, and a race page if it has one. */
  pages: Pages<Id>;
  /** Whether its text is in Spanish. Untranslated modules still get /es pages, in English and marked noindex. */
  translated: boolean;
  /** Its card on the landing page. */
  landing: {
    title: string;
    summary: string;
    /** How much is in it, e.g. "9 algorithms". */
    count: string;
  };
  /** What search engines see on each page. */
  seo: {
    /** The module's name in the breadcrumb trail. */
    section: string;
    start: Meta;
    /** An algorithm page's meta, plus its own name in the breadcrumb trail. */
    algorithm: (algorithm: Id) => Meta & { crumb: string };
    race?: Meta;
  };
  /**
   * The hint under the stage on each page. The start page's says "About …" and just takes you
   * to the article; the others name the article's first explanation ("How X works"), so they open it too.
   */
  hints: {
    start: string;
    /** The race page's, when it isn't "How the race works". */
    race?: string;
  } & (
    | {
        /** What works on an algorithm page, as its hint names it: "Insertion Sort" in "How Insertion Sort works". */
        works: (algorithm: Id) => string;
      }
    | {
        /** The explanation's own title, for modules whose titles don't read "How … works" in every language. */
        heading: (algorithm: Id) => string;
      }
  );
  /**
   * A link to one of its algorithm pages with settings that differ from the defaults, its query
   * as the module's link codec writes it at 2× speed. Shared tests open every module on it.
   */
  example: { algorithm: Id; search: string };
} & (
  | { pages: { race: true }; seo: { race: Meta } }
  | { pages: { race: false }; seo: { race?: never }; hints: { race?: never } }
);

/** Every module's pages, from its manifest. */
export const modulePages = Object.fromEntries(MODULES.map((module) => [module, manifests[module].pages])) as {
  [M in ModuleId]: (typeof manifests)[M]["pages"];
};

/** The algorithms a module has pages for (in backtracking, the problems). */
export type AlgorithmOf<M extends ModuleId> = keyof (typeof manifests)[M]["pages"]["slugs"] & string;

/** The modules with a race page. */
export type RacingModule = { [M in ModuleId]: (typeof manifests)[M]["pages"]["race"] extends true ? M : never }[ModuleId];

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
    const { base, slugs, race } = modulePages[module] as Pages<string>;
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
    const { slugs, race } = modulePages[module] as Pages<string>;
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
 * Modules whose text is in Spanish (their manifests say so). Their /es pages are indexed and linked
 * with hreflang. A module that isn't translated yet still gets /es pages, in English and marked noindex.
 */
export const TRANSLATED_MODULES: ReadonlySet<ModuleId> = new Set(MODULES.filter((module) => manifests[module].translated));

/** Whether a page has a Spanish version worth indexing. The landing page does. */
export const isTranslated = (route: Route, translated: ReadonlySet<ModuleId> = TRANSLATED_MODULES): boolean => {
  const module = moduleOf(route);
  return module === null || translated.has(module);
};
