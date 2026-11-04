import type { Algorithm } from "./types";

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

/** Every page the site has. Settings (size, input, speed, seed…) stay in the query string. */
export type Route = { kind: "home" } | { kind: "algorithm"; algorithm: Algorithm } | { kind: "race" };

export const routePath = (route: Route): string => {
  if (route.kind === "home") return "/";
  if (route.kind === "race") return "/sorting/race";
  return `/sorting/${algorithmSlugs[route.algorithm]}`;
};

/** The page a path points at, or null for paths the site doesn't have. */
export const routeFromPath = (pathname: string): Route | null => {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return { kind: "home" };
  if (path === "/sorting/race") return { kind: "race" };
  const match = /^\/sorting\/([a-z-]+)$/.exec(path);
  if (!match) return null;
  const entry = Object.entries(algorithmSlugs).find(([, slug]) => slug === match[1]);
  return entry ? { kind: "algorithm", algorithm: entry[0] as Algorithm } : null;
};

/** All pages, for prerendering and the sitemap. */
export const allRoutes: Route[] = [
  { kind: "home" },
  ...(Object.keys(algorithmSlugs) as Algorithm[]).map((algorithm) => ({ kind: "algorithm" as const, algorithm })),
  { kind: "race" },
];
