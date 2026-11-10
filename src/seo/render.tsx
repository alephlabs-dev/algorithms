import { renderToString } from "react-dom/server";
import { Page } from "@/Page";
import { allRoutes, href, isTranslated, pathIn, SITE_URL, type ModuleId, type Route } from "@/routes";
import { renderHead } from "./head";

/**
 * Build-time entry (see vite-plugin-prerender.ts): one static HTML file per
 * page. The build loads it once per language; `href` gives each page's path
 * in that language.
 */

export { allRoutes, href };

const ROOT = '<div id="root"></div>';

/**
 * The page's HTML: its own head, plus inside #root the same tree the app
 * renders first (src/Page.tsx), so the app hydrates it in place (#140): a
 * visualizer page has an empty stage with its article below it, and the
 * landing page is all content.
 */
export const renderPage = (template: string, route: Route): string => {
  if (!template.includes(ROOT)) throw new Error(`index.html is missing ${ROOT}`);
  return renderHead(template, route).replace(ROOT, `<div id="root">${renderToString(<Page route={route} />)}</div>`);
};

/** Modules whose start page ranks above the other module pages in the sitemap. */
const FEATURED: ReadonlySet<ModuleId> = new Set(["sorting", "pathfinding"]);

export const sitemap = (lastModified: string): string => {
  // Spanish pages are listed once their module is translated.
  const pages = [
    ...allRoutes.map((route) => ({ route, path: pathIn(route, "en") })),
    ...allRoutes.filter((route) => isTranslated(route)).map((route) => ({ route, path: pathIn(route, "es") })),
  ];
  const urls = pages
    .map(({ route, path }) => {
      const priority =
        route.page === "home" ? "1.0" : route.page === "start" && FEATURED.has(route.module) ? "0.9" : "0.8";
      return `  <url><loc>${SITE_URL}${path === "/" ? "/" : path}</loc><lastmod>${lastModified}</lastmod><priority>${priority}</priority></url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

export const robots = (): string => `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
