import { describe, expect, it } from "vitest";
import { allRoutes } from "@/routes";
import { renderHead } from "./head";
import { pageMeta } from "./pages";
import template from "../../index.html?raw";

describe("renderHead", () => {
  it("gives every page its own title, description and canonical URL", () => {
    const titles = new Set<string>();
    for (const route of allRoutes) {
      const meta = pageMeta(route);
      const html = renderHead(template, route);
      expect(html).toContain(`<title>${meta.title.replace(/&/g, "&amp;")}</title>`);
      expect(html).toContain(`<link rel="canonical" href="${meta.url}"`);
      expect(html).toContain(`<meta property="og:url" content="${meta.url}"`);
      expect(html).not.toContain('id="structured-data">{}');
      titles.add(meta.title);
    }
    expect(titles.size).toBe(allRoutes.length);
  });

  it("keeps descriptions within what search results show", () => {
    for (const route of allRoutes) expect(pageMeta(route).description.length).toBeLessThanOrEqual(200);
  });
});
