import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { RACE_DESCRIPTION } from "@/consts/race";
import { routePath, SITE_URL, type Route } from "@/routes";

export const SITE_NAME = "Aleph Labs Algorithms";

/** What search engines and social cards see for a page. */
export type PageMeta = {
  path: string;
  url: string;
  title: string;
  description: string;
};

export const pageMeta = (route: Route): PageMeta => {
  const path = routePath(route);
  const url = SITE_URL + (path === "/" ? "/" : path);

  if (route.kind === "home") {
    return {
      path,
      url,
      title: "Algorithm Visualizer: Sorting and Pathfinding Step by Step · Aleph Labs",
      description:
        "Watch Quick Sort, Merge Sort and seven more sort an array, and Dijkstra, A* and BFS search a maze, step by step with pseudocode and plain-language explanations.",
    };
  }
  if (route.kind === "race") {
    return {
      path,
      url,
      title: "Sorting Algorithm Race: Compare Algorithms Side by Side · Aleph Labs",
      description: `Race up to four sorting algorithms on the same array. ${RACE_DESCRIPTION}`.slice(0, 160),
    };
  }
  if (route.kind === "pathRace") {
    return {
      path,
      url,
      title: "Pathfinding Race: BFS vs Dijkstra vs A* Side by Side · Aleph Labs",
      description:
        "Race BFS, DFS, Dijkstra, A* and Greedy Best-First Search on the same grid. See which looks at the fewest cells, and which finds the cheapest path.",
    };
  }
  if (route.kind === "path") {
    const { title, short } = pathAlgorithms[route.algorithm];
    const name = title.includes(short) ? title : `${title} (${short})`;
    return {
      path,
      url,
      title: `${name} Pathfinding Visualized · Aleph Labs`,
      description: `See how ${title} finds a path: draw walls and mud on a grid, then watch it search step by step with the pseudocode and every step explained.`,
    };
  }
  const { title, timeComplexity } = sortingAlgorithms[route.algorithm];
  return {
    path,
    url,
    title: `${title} Visualized Step by Step · Aleph Labs`,
    description: `See how ${title} works: watch it sort an array step by step, follow the pseudocode line by line and compare it with other algorithms. ${timeComplexity.average} on average.`,
  };
};

/** Structured data (JSON-LD) so search engines know what each page is. */
export const structuredData = (route: Route): object[] => {
  const meta = pageMeta(route);
  const publisher = { "@type": "Organization", name: "Aleph Labs" };
  if (route.kind === "home") {
    return [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Algorithm Visualizer",
        url: meta.url,
        description: meta.description,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher,
      },
    ];
  }
  const name =
    route.kind === "race" || route.kind === "pathRace"
      ? "Race"
      : route.kind === "path"
        ? pathAlgorithms[route.algorithm].title
        : sortingAlgorithms[route.algorithm].title;
  const section = route.kind === "path" || route.kind === "pathRace" ? "Pathfinding" : "Sorting";
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
      itemListElement: [
        { "@type": "ListItem", position: 1, name: section, item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name, item: meta.url },
      ],
    },
  ];
};
