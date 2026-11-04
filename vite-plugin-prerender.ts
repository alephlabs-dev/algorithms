import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServer, type Plugin } from "vite";

// The shape of src/seo/render.tsx (not imported: this file is compiled without JSX).
type Route = unknown;
type RenderModule = {
  allRoutes: Route[];
  routePath: (route: Route) => string;
  renderPage: (template: string, route: Route) => string;
  sitemap: (lastModified: string) => string;
  robots: () => string;
};

/**
 * After the build, writes one HTML file per page (dist/sorting/quick-sort.html…)
 * with its own title, meta tags and written content, plus sitemap.xml and
 * robots.txt. Vercel's cleanUrls serves sorting/quick-sort.html at
 * /sorting/quick-sort. The pages are rendered by loading src/seo/render.tsx
 * through a throwaway Vite server, so they share the app's code and aliases.
 */
export const prerender = (): Plugin => {
  let root = "";
  let outDir = "";
  return {
    name: "prerender-pages",
    apply: "build",
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const server = await createServer({
        root,
        configFile: false,
        logLevel: "error",
        appType: "custom",
        server: { middlewareMode: true, hmr: false, ws: false },
        resolve: { alias: { "@": path.resolve(root, "src") } },
      });
      try {
        const render = (await server.ssrLoadModule("/src/seo/render.tsx")) as RenderModule;
        const template = await readFile(path.join(outDir, "index.html"), "utf8");
        for (const route of render.allRoutes) {
          const urlPath = render.routePath(route);
          const file = urlPath === "/" ? "index.html" : `${urlPath.slice(1)}.html`;
          await mkdir(path.dirname(path.join(outDir, file)), { recursive: true });
          await writeFile(path.join(outDir, file), render.renderPage(template, route));
        }
        const today = new Date().toISOString().slice(0, 10);
        await writeFile(path.join(outDir, "sitemap.xml"), render.sitemap(today));
        await writeFile(path.join(outDir, "robots.txt"), render.robots());
        this.info(`prerendered ${render.allRoutes.length} pages, sitemap.xml and robots.txt`);
      } finally {
        await server.close();
      }
    },
  };
};
