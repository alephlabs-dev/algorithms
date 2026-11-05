import { renderToString } from "react-dom/server";
import { About } from "@/components/About";
import { Landing } from "@/components/Landing/Landing";
import { allRoutes, href, isTranslated, pathIn, SITE_URL, type Route } from "@/routes";
import { renderHead } from "./head";

/**
 * Build-time entry (see vite-plugin-prerender.ts): one static HTML file per
 * page. The build loads it once per language; `href` gives each page's path
 * in that language.
 */

export { allRoutes, href };

const ROOT = '<div id="root"></div>';

/**
 * The page's HTML: its own head, plus its article inside #root. The empty
 * full-height block stands in for the visualizer until the app mounts and
 * replaces everything in #root with the same layout, so nothing jumps.
 */
export const renderPage = (template: string, route: Route): string => {
  if (!template.includes(ROOT)) throw new Error(`index.html is missing ${ROOT}`);
  // The landing page is all content; other pages are a visualizer with their article below.
  const body =
    route.kind === "home"
      ? renderToString(<Landing />)
      : `<div class="h-dvh"></div>${renderToString(<About route={route} />)}`;
  return renderHead(template, route).replace(ROOT, `<div id="root">${body}</div>`);
};

export const sitemap = (lastModified: string): string => {
  // Spanish pages are listed once their module is translated.
  const pages = [
    ...allRoutes.map((route) => ({ route, path: pathIn(route, "en") })),
    ...allRoutes.filter(isTranslated).map((route) => ({ route, path: pathIn(route, "es") })),
  ];
  const urls = pages
    .map(({ route, path }) => {
      const priority = route.kind === "home" ? "1.0" : route.kind === "sorting" || route.kind === "pathfinding" ? "0.9" : "0.8";
      return `  <url><loc>${SITE_URL}${path === "/" ? "/" : path}</loc><lastmod>${lastModified}</lastmod><priority>${priority}</priority></url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

export const robots = (): string => `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
