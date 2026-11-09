import { describe, expect, it } from "vitest";
import { LANGS } from "./i18n";
import { allRoutes, moduleOf, modulePages, pathIn, routeFromPath, routePath, type ModuleId } from "./routes";

const MODULES = Object.keys(modulePages) as ModuleId[];

describe("routes", () => {
  it("lists every module's start page, every algorithm in its table, and its race if it has one", () => {
    for (const module of MODULES) {
      const { slugs, race } = modulePages[module];
      const pages = allRoutes.filter((route) => moduleOf(route) === module);
      expect(pages.filter((route) => route.page === "start")).toHaveLength(1);
      expect(pages.filter((route) => route.page === "race")).toHaveLength(race ? 1 : 0);
      expect(pages.flatMap((route) => (route.page === "algorithm" ? [route.algorithm] : []))).toEqual(Object.keys(slugs));
    }
    expect(allRoutes.filter((route) => route.page === "home")).toHaveLength(1);
  });

  it.each(LANGS)("round-trips every page through its path in %s", (language) => {
    for (const route of allRoutes) expect(routeFromPath(pathIn(route, language))).toEqual(route);
  });

  it.each(LANGS)("rejects unknown slugs under every module in %s", (language) => {
    for (const module of MODULES) {
      const base = pathIn({ module, page: "start" }, language);
      expect(routeFromPath(`${base}/not-a-page`)).toBeNull();
      expect(routeFromPath(`${base}/race/extra`)).toBeNull();
      if (!modulePages[module].race) expect(routeFromPath(`${base}/race`)).toBeNull();
    }
  });

  it("ignores trailing slashes and rejects paths the site doesn't have", () => {
    expect(routeFromPath("/sorting/quick-sort/")).toEqual({ module: "sorting", page: "algorithm", algorithm: "quick" });
    expect(routeFromPath("/sorting/bogo-sort")).toBeNull();
    expect(routeFromPath("/about")).toBeNull();
    // A page that merely starts with "es" isn't Spanish.
    expect(routeFromPath("/estimate")).toBeNull();
  });

  it("writes the paths the site has always served", () => {
    expect(routePath({ page: "home" })).toBe("/");
    expect(routePath({ module: "dp", page: "start" })).toBe("/dynamic-programming");
    expect(routePath({ module: "dp", page: "race" })).toBe("/dynamic-programming/race");
    expect(routePath({ module: "backtracking", page: "algorithm", algorithm: "queens" })).toBe("/backtracking/n-queens");
    expect(pathIn({ page: "home" }, "es")).toBe("/es");
    expect(pathIn({ module: "sorting", page: "algorithm", algorithm: "quick" }, "es")).toBe("/es/sorting/quick-sort");
    expect(pathIn({ module: "sorting", page: "algorithm", algorithm: "quick" }, "en")).toBe("/sorting/quick-sort");
  });

  it("types each module's algorithms and races", () => {
    // @ts-expect-error dp has no bfs
    routePath({ module: "dp", page: "algorithm", algorithm: "bfs" });
    // @ts-expect-error fourier has no race page
    routePath({ module: "fourier", page: "race" });
  });
});
