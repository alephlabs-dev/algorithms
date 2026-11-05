import { dpProblems } from "@/consts/dp";
import { fourierSeries } from "@/consts/fourierSeries";
import { structures } from "@/consts/structures";
import { graphAlgorithms } from "@/consts/graphAlgorithms";
import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { RACE_DESCRIPTION } from "@/consts/race";
import { localized } from "@/i18n";
import { href, moduleOf, SITE_URL, type Route } from "@/routes";

export const SITE_NAME = "Aleph Labs Algorithms";

// Sorting's pages, in both languages. Other modules are translated in their own sub-issues of #36.
const sortingText = localized({
  en: {
    moduleTitle: "Sorting Algorithm Visualizer: 9 Algorithms Step by Step · Aleph Labs",
    moduleDescription:
      "Watch Bubble, Insertion, Quick, Merge, Heap, Radix Sort and more sort an array step by step, with the pseudocode lit up and every move explained.",
    raceTitle: "Sorting Algorithm Race: Compare Algorithms Side by Side · Aleph Labs",
    raceDescription: (description: string) => `Race up to four sorting algorithms on the same array. ${description}`.slice(0, 160),
    algorithmTitle: (title: string) => `${title} Visualized Step by Step · Aleph Labs`,
    algorithmDescription: (title: string, average: string) =>
      `See how ${title} works: watch it sort an array step by step, follow the pseudocode line by line and compare it with other algorithms. ${average} on average.`,
    section: "Sorting",
    race: "Race",
  },
  es: {
    moduleTitle: "Visualizador de algoritmos de ordenamiento: 9 algoritmos paso a paso · Aleph Labs",
    moduleDescription:
      "Mira cómo Bubble, Insertion, Quick, Merge, Heap, Radix Sort y más ordenan un arreglo paso a paso, con el pseudocódigo resaltado y cada movimiento explicado.",
    raceTitle: "Carrera de algoritmos de ordenamiento: compáralos lado a lado · Aleph Labs",
    raceDescription: (description) =>
      `Haz competir hasta cuatro algoritmos de ordenamiento con el mismo arreglo. ${description}`.slice(0, 200),
    algorithmTitle: (title) => `${title} paso a paso, visualizado · Aleph Labs`,
    algorithmDescription: (title, average) =>
      `Mira cómo funciona ${title}: ordena un arreglo paso a paso, sigue el pseudocódigo línea por línea y compáralo con otros algoritmos. ${average} en promedio.`,
    section: "Ordenamiento",
    race: "Carrera",
  },
});

// The home page is translated with the landing page (#69).
const ROOT_NAME = localized({ en: "Algorithms", es: "Algoritmos" });

/** What search engines and social cards see for a page. */
export type PageMeta = {
  path: string;
  url: string;
  title: string;
  description: string;
};

export const pageMeta = (route: Route): PageMeta => {
  const path = href(route);
  const url = SITE_URL + (path === "/" ? "/" : path);

  if (route.kind === "home") {
    return {
      path,
      url,
      title: "Algorithm Visualizer: Sorting, Graphs, Data Structures, DP and More · Aleph Labs",
      description:
        "Watch sorts, A*, Dijkstra, AVL rotations, hash tables, Fourier circles and dynamic programming tables work step by step, with pseudocode and plain-language explanations.",
    };
  }
  if (route.kind === "sorting") {
    return {
      path,
      url,
      title: sortingText.moduleTitle,
      description: sortingText.moduleDescription,
    };
  }
  if (route.kind === "pathfinding") {
    return {
      path,
      url,
      title: "Pathfinding Visualizer: BFS, Dijkstra and A* Step by Step · Aleph Labs",
      description:
        "Draw walls and mud on a grid, then watch BFS, DFS, Dijkstra, A* and Greedy Best-First Search find a path, step by step with the pseudocode.",
    };
  }
  if (route.kind === "graphs") {
    return {
      path,
      url,
      title: "Graph Algorithm Visualizer: BFS, Dijkstra, Prim, Kruskal Step by Step · Aleph Labs",
      description:
        "Watch BFS, DFS, Dijkstra, Prim, Kruskal and topological sort on a graph you can reshape, with the queue, the stack and every distance shown as they change.",
    };
  }
  if (route.kind === "graph") {
    const { title, short, structure } = graphAlgorithms[route.algorithm];
    // Acronyms people search for (BFS, DFS) go in brackets; other short names don't.
    const name = /^[A-Z]{2,4}$/.test(short) ? `${title} (${short})` : title;
    return {
      path,
      url,
      title: `${name} on a Graph, Visualized · Aleph Labs`,
      description: `See how ${title} walks a graph: drag nodes, join them, pick the start, then follow its ${structure.toLowerCase()} step by step with the pseudocode.`,
    };
  }
  if (route.kind === "structures") {
    return {
      path,
      url,
      title: "Data Structure Visualizer: BST, AVL Tree, Heap, Hash Table · Aleph Labs",
      description:
        "Insert, search and delete in a binary search tree, an AVL tree, a min-heap or a hash table, and watch every comparison, rotation, swap and probe, step by step with the pseudocode.",
    };
  }
  if (route.kind === "structure") {
    const { title, shortDescription } = structures[route.algorithm];
    return {
      path,
      url,
      title: `${title} Visualized: Insert, Search, Delete · Aleph Labs`,
      description: shortDescription.slice(0, 200),
    };
  }
  if (route.kind === "structureRace") {
    return {
      path,
      url,
      title: "BST vs AVL Tree: Why Balancing Matters · Aleph Labs",
      description:
        "The same values into a plain binary search tree and an AVL tree, side by side. Sorted input turns the BST into a list; the AVL tree rotates to stay short.",
    };
  }
  if (route.kind === "fourier") {
    return {
      path,
      url,
      title: "Fourier Series Visualizer: Waves and Drawings from Circles · Aleph Labs",
      description:
        "Build a square, sawtooth or triangle wave from turning circles, or watch circles on circles retrace constellations, drawings or your own. See the fit improve with every circle.",
    };
  }
  if (route.kind === "series") {
    const { title, shortDescription } = fourierSeries[route.algorithm];
    return {
      path,
      url,
      title:
        route.algorithm === "epicycles"
          ? "Fourier Epicycles: Draw Any Shape with Circles · Aleph Labs"
          : `${title} Fourier Series, Visualized with Circles · Aleph Labs`,
      description: shortDescription.slice(0, 200),
    };
  }
  if (route.kind === "graphRace") {
    return {
      path,
      url,
      title: "Graph Algorithm Race: Prim vs Kruskal, BFS vs DFS · Aleph Labs",
      description:
        "Race BFS, DFS, Dijkstra, Prim, Kruskal and topological sort on the same graph, one step per tick. See which has the least to do, and how Prim and Kruskal reach the same tree.",
    };
  }
  if (route.kind === "race") {
    return {
      path,
      url,
      title: sortingText.raceTitle,
      description: sortingText.raceDescription(RACE_DESCRIPTION),
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
  if (route.kind === "dp") {
    return {
      path,
      url,
      title: "Dynamic Programming Visualizer: Edit Distance, LCS, Knapsack · Aleph Labs",
      description:
        "Watch a dynamic programming table fill cell by cell, then walk back from the corner to the answer: the edits between two words, what they share, or what fits in a bag.",
    };
  }
  if (route.kind === "dpRace") {
    return {
      path,
      url,
      title: "Recursion vs Memoization vs Table: Dynamic Programming Race · Aleph Labs",
      description:
        "One knapsack solved three ways side by side: plain recursion redoing the same subproblems, memoized recursion, and the bottom-up table. Count the work each does.",
    };
  }
  if (route.kind === "dpProblem") {
    const { title, shortDescription } = dpProblems[route.algorithm];
    return {
      path,
      url,
      title: `${title} Visualized: The Dynamic Programming Table · Aleph Labs`,
      description: shortDescription.slice(0, 200),
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
    title: sortingText.algorithmTitle(title),
    description: sortingText.algorithmDescription(title, timeComplexity.average),
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
  const module = moduleOf(route) ?? "sorting";
  const sectionNames = {
    sorting: sortingText.section,
    pathfinding: "Pathfinding",
    graphs: "Graphs",
    fourier: "Fourier series",
    structures: "Data structures",
    dp: "Dynamic programming",
  };
  const sectionRoutes = {
    sorting: { kind: "sorting" },
    pathfinding: { kind: "pathfinding" },
    graphs: { kind: "graphs" },
    fourier: { kind: "fourier" },
    structures: { kind: "structures" },
    dp: { kind: "dp" },
  } as const;
  const section = { name: sectionNames[module], url: `${SITE_URL}${href(sectionRoutes[module])}` };
  const name =
    route.kind === "race"
      ? sortingText.race
      : route.kind === "pathRace" ||
    route.kind === "graphRace" ||
    route.kind === "structureRace" ||
    route.kind === "dpRace"
      ? "Race"
      : route.kind === "path"
        ? pathAlgorithms[route.algorithm].title
        : route.kind === "graph"
          ? `${graphAlgorithms[route.algorithm].title} on a graph`
          : route.kind === "series"
            ? fourierSeries[route.algorithm].title
            : route.kind === "structure"
              ? structures[route.algorithm].title
            : route.kind === "dpProblem"
              ? dpProblems[route.algorithm].title
        : route.kind === "algorithm"
          ? sortingAlgorithms[route.algorithm].title
          : null;
  // Home › module › page; a module's own page stops at the module.
  const trail = [{ name: ROOT_NAME, url: `${SITE_URL}${href({ kind: "home" })}` }, section, ...(name ? [{ name, url: meta.url }] : [])];
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
