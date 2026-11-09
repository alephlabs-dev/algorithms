import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import template from "../../index.html?raw";

// The language is fixed when the modules load, so load them again as the Spanish build does.
describe("renderHead in Spanish", () => {
  let renderHead: typeof import("./head").renderHead;
  let pageMeta: typeof import("./pages").pageMeta;

  beforeAll(async () => {
    vi.stubGlobal("__LANG__", "es");
    vi.resetModules();
    ({ renderHead } = await import("./head"));
    ({ pageMeta } = await import("./pages"));
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("marks a translated page as Spanish and links both languages", () => {
    const html = renderHead(template, { module: "sorting", page: "algorithm", algorithm: "quick" });
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('<link rel="canonical" href="https://algorithms-aleph.vercel.app/es/sorting/quick-sort"');
    expect(html).toContain('<link rel="alternate" hreflang="es" href="https://algorithms-aleph.vercel.app/es/sorting/quick-sort" />');
    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://algorithms-aleph.vercel.app/sorting/quick-sort" />');
    expect(html).toContain('hreflang="x-default" href="https://algorithms-aleph.vercel.app/sorting/quick-sort"');
    expect(html).not.toContain('name="robots"');
    expect(pageMeta({ module: "sorting", page: "algorithm", algorithm: "quick" }).title).toMatch(/paso a paso/);
  });

  it("gives the Spanish home page its own address and both languages", () => {
    const html = renderHead(template, { page: "home" });
    expect(html).toContain('<link rel="canonical" href="https://algorithms-aleph.vercel.app/es"');
    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://algorithms-aleph.vercel.app/" />');
    expect(html).not.toContain('name="robots"');
    expect(pageMeta({ page: "home" }).title).toMatch(/^Visualizador de algoritmos/);
  });

  it("keeps a page whose module isn't translated yet out of search", () => {
    // Every module is translated today; a new one starts outside the list.
    const html = renderHead(template, { module: "fourier", page: "start" }, new Set(["sorting", "pathfinding", "graphs", "structures", "dp"]));
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).not.toContain('rel="alternate"');
  });

  it("keeps descriptions within what search results show", async () => {
    const { allRoutes } = await import("@/routes");
    for (const route of allRoutes) expect(pageMeta(route).description.length).toBeLessThanOrEqual(200);
  });
});
