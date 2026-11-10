import { describe, expect, it } from "vitest";
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Sorting titles come from its manifest.
import { sortingAlgorithms } from "@/modules/sorting/algorithms";
import { createAppStore } from "@/appStore";
import { routeFor } from "@/navigation";
import { allRoutes, href } from "@/routes";
import { readLocation } from "@/urlState";
import { renderPage } from "./render";
import template from "../../index.html?raw";

/** React escapes these in text; the rest of a description comes out as written. */
const escaped = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;");

describe("renderPage", () => {
  const html = renderPage(template, { module: "sorting", page: "algorithm", algorithm: "insertion" });

  it("prerenders the explanation closed, with its text still in the page", () => {
    const details = html.match(/<details data-disclosure="[^"]*"[^>]*>([\s\S]*?)<\/details>/);
    expect(details, "a disclosure").not.toBeNull();
    expect(details![0], "closed: no open attribute").not.toMatch(/<details[^>]*\sopen/);
    const summary = details![1].match(/<summary[^>]*><h2[^>]*>(.*?)<\/h2>/);
    expect(summary, "a summary holding the heading").not.toBeNull();
    expect(summary![1]).toContain("How Insertion Sort works");
    expect(details![1]).toContain(escaped(sortingAlgorithms.insertion.longDescription));
  });

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
