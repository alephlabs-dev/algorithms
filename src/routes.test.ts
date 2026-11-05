import { describe, expect, it } from "vitest";
import { allRoutes, pathIn, routeFromPath, routePath } from "./routes";

describe("routes", () => {
  it("round-trips every page through its path", () => {
    for (const route of allRoutes) expect(routeFromPath(routePath(route))).toEqual(route);
  });

  it("ignores trailing slashes and rejects unknown paths", () => {
    expect(routeFromPath("/sorting/quick-sort/")).toEqual({ kind: "algorithm", algorithm: "quick" });
    expect(routeFromPath("/sorting/bogo-sort")).toBeNull();
    expect(routeFromPath("/about")).toBeNull();
  });

  it("reads Spanish paths as the same page, and writes them under /es", () => {
    for (const route of allRoutes) expect(routeFromPath(pathIn(route, "es"))).toEqual(route);
    expect(pathIn({ kind: "home" }, "es")).toBe("/es");
    expect(pathIn({ kind: "algorithm", algorithm: "quick" }, "es")).toBe("/es/sorting/quick-sort");
    expect(pathIn({ kind: "algorithm", algorithm: "quick" }, "en")).toBe("/sorting/quick-sort");
    // A page that merely starts with "es" isn't Spanish.
    expect(routeFromPath("/estimate")).toBeNull();
  });
});
