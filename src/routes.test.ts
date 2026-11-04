import { describe, expect, it } from "vitest";
import { allRoutes, routeFromPath, routePath } from "./routes";

describe("routes", () => {
  it("round-trips every page through its path", () => {
    for (const route of allRoutes) expect(routeFromPath(routePath(route))).toEqual(route);
  });

  it("ignores trailing slashes and rejects unknown paths", () => {
    expect(routeFromPath("/sorting/quick-sort/")).toEqual({ kind: "algorithm", algorithm: "quick" });
    expect(routeFromPath("/sorting/bogo-sort")).toBeNull();
    expect(routeFromPath("/about")).toBeNull();
  });
});
