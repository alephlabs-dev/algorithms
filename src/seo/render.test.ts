import { describe, expect, it } from "vitest";
import { createAppStore } from "@/appStore";
import { routeFor } from "@/navigation";
import { allRoutes, href } from "@/routes";
import { readLocation } from "@/urlState";
import { renderPage } from "./render";
import template from "../../index.html?raw";

// How a sorting page prerenders its explanation is in src/modules/sorting/render.test.ts.
describe("renderPage", () => {
  const html = renderPage(template, { module: "sorting", page: "algorithm", algorithm: "insertion" });

  it("leaves the stage empty, for the app to fill after it hydrates", () => {
    expect(html).toContain('<div id="root"><div id="stage" class="min-h-dvh"></div><article id="about"');
  });

  it("keeps the summary table open", () => {
    expect(html).toMatch(/<h2[^>]*>Time and space complexity<\/h2>/);
  });
});

// The app's first render must be the prerendered tree (#140), so it has to land on the same page.
describe("the app's first page", () => {
  it.each(allRoutes.map((route) => [href(route), route] as const))("is the prerendered one at %s", (path, route) => {
    const url = readLocation(path, "");
    const app = createAppStore({ url, isMobile: false, isPortrait: false, theme: "dark" });
    expect(routeFor(app.getState())).toEqual(route);
  });
});
