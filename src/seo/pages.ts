import { localized } from "@/i18n";
import { manifests } from "@/modules/manifests";
import { HOME, href, SITE_URL, type Meta, type Route } from "@/routes";

export const SITE_NAME = "Aleph Labs Algorithms";

/** Every page title ends with it; manifests and the pages here give only their own part. */
const BRAND = "Aleph Labs";

const homeText = localized({
  en: {
    title: "Algorithm Visualizer: Sorting, Graphs, Data Structures, DP and More",
    description:
      "Watch sorts, A*, Dijkstra, AVL rotations, hash tables, Fourier circles and dynamic programming tables work step by step, with pseudocode and plain-language explanations.",
    appName: "Algorithm Visualizer",
    root: "Algorithms",
    race: "Race",
  },
  es: {
    title: "Visualizador de algoritmos: ordenamiento, grafos, estructuras de datos, PD y más",
    description:
      "Mira paso a paso ordenamientos, A*, Dijkstra, rotaciones AVL, tablas hash, círculos de Fourier y tablas de programación dinámica, con pseudocódigo y explicaciones simples.",
    appName: "Visualizador de algoritmos",
    root: "Algoritmos",
    race: "Carrera",
  },
});
const ROOT_NAME = homeText.root;

/** What search engines and social cards see for a page. */
export type PageMeta = {
  path: string;
  url: string;
  title: string;
  description: string;
};

/** A page's meta, and its own name in the breadcrumb trail (a module's start page and the landing page have none). */
const metaOf = (route: Route): Meta & { crumb?: string } => {
  if (route.page === "home") return { title: homeText.title, description: homeText.description };
  // Each manifest's types hold where it's declared; here they're read through one shape.
  const seo = manifests[route.module].seo as {
    start: Meta;
    algorithm: (algorithm: string) => Meta & { crumb: string };
    race?: Meta;
  };
  if (route.page === "algorithm") return seo.algorithm(route.algorithm);
  if (route.page === "race") return { ...seo.race!, crumb: homeText.race };
  return seo.start;
};

export const pageMeta = (route: Route): PageMeta => {
  const path = href(route);
  const url = SITE_URL + (path === "/" ? "/" : path);
  const { title, description } = metaOf(route);
  return { path, url, title: `${title} · ${BRAND}`, description };
};

/** Structured data (JSON-LD) so search engines know what each page is. */
export const structuredData = (route: Route): object[] => {
  const meta = pageMeta(route);
  const publisher = { "@type": "Organization", name: BRAND };
  if (route.page === "home") {
    return [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: homeText.appName,
        url: meta.url,
        description: meta.description,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher,
      },
    ];
  }
  const section = { name: manifests[route.module].seo.section, url: `${SITE_URL}${href({ module: route.module, page: "start" })}` };
  const name = metaOf(route).crumb;
  // Home › module › page; a module's own page stops at the module.
  const trail = [{ name: ROOT_NAME, url: `${SITE_URL}${href(HOME)}` }, section, ...(name ? [{ name, url: meta.url }] : [])];
  return [
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: meta.title,
      description: meta.description,
      url: meta.url,
      learningResourceType: "Interactive visualization",
      educationalLevel: "Beginner",
      publisher,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: trail.map((step, k) => ({ "@type": "ListItem", position: k + 1, name: step.name, item: step.url })),
    },
  ];
};
