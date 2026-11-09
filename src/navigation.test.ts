import { describe, expect, it } from "vitest";
import { createAppStore, selectLastIndex } from "@/appStore";
import { engines } from "@/modules/engine";
import { applyRoute, routeFor } from "@/navigation";
import { allRoutes, HOME, href, moduleOf, type Route } from "@/routes";
import { readLocation } from "@/urlState";

const storeAt = (route: Route) =>
  createAppStore({ url: readLocation(href(route), ""), isMobile: false, isPortrait: false, theme: "dark" });

const modulePages = allRoutes.filter((route) => route.page !== "home");
// Each page is opened from somewhere else: the landing page, and a page of another module.
const elsewhere = (route: Route): Route =>
  allRoutes.find((other) => other.page === "algorithm" && other.module !== moduleOf(route))!;

const label = (route: Route) => href(route);

describe.each(["the landing page", "another module"])("applyRoute from %s", (from) => {
  it.each(modulePages.map((route) => [label(route), route] as const))("opens %s", (_, route) => {
    const app = storeAt(from === "the landing page" ? HOME : elsewhere(route));
    applyRoute(app, route);
    const s = app.getState();
    expect(routeFor(s)).toEqual(route);
    expect(s.isLanding).toBe(false);
    expect(s.isModuleStart).toBe(route.page === "start");
    expect(s.module).toBe(route.module);
    expect(s.view).toBe(route.page === "race" ? "race" : "single");
    if (route.page === "algorithm") expect(engines[route.module].current(s)).toBe(route.algorithm);
  });
});

describe("applyRoute", () => {
  it.each(modulePages.map((route) => [label(route), route] as const))(
    "leaves the run alone when %s is already on screen",
    (_, route) => {
      const app = storeAt(route);
      const last = selectLastIndex(app.getState());
      app.getState().seek(Math.floor(last / 2));
      const frame = app.getState().frameIndex;
      expect(frame).toBeGreaterThan(0);
      applyRoute(app, route);
      expect(app.getState().frameIndex).toBe(frame);
      expect(routeFor(app.getState())).toEqual(route);
    },
  );

  it("goes back to the landing page from any page", () => {
    for (const route of modulePages) {
      const app = storeAt(route);
      applyRoute(app, HOME);
      expect(app.getState().isLanding, href(route)).toBe(true);
      expect(app.getState().isPlaying).toBe(false);
      expect(routeFor(app.getState())).toEqual(HOME);
    }
  });

  it("opens a module's start page with the algorithm it last had", () => {
    const app = storeAt({ module: "graphs", page: "algorithm", algorithm: "prim" });
    applyRoute(app, { module: "sorting", page: "algorithm", algorithm: "quick" });
    applyRoute(app, { module: "graphs", page: "start" });
    expect(app.getState().graphs.algorithm).toBe("prim");
    expect(app.getState().isModuleStart).toBe(true);
  });
});
