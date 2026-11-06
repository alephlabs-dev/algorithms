import { backtrackingProblems } from "@/consts/backtracking";
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

const pathText = localized({
  en: {
    moduleTitle: "Pathfinding Visualizer: BFS, Dijkstra and A* Step by Step · Aleph Labs",
    moduleDescription:
      "Draw walls and mud on a grid, then watch BFS, DFS, Dijkstra, A* and Greedy Best-First Search find a path, step by step with the pseudocode.",
    raceTitle: "Pathfinding Race: BFS vs Dijkstra vs A* Side by Side · Aleph Labs",
    raceDescription:
      "Race BFS, DFS, Dijkstra, A* and Greedy Best-First Search on the same grid. See which looks at the fewest cells, and which finds the cheapest path.",
    name: (title: string, short: string) => (title.includes(short) ? title : `${title} (${short})`),
    algorithmTitle: (name: string) => `${name} Pathfinding Visualized · Aleph Labs`,
    algorithmDescription: (title: string) =>
      `See how ${title} finds a path: draw walls and mud on a grid, then watch it search step by step with the pseudocode and every step explained.`,
    section: "Pathfinding",
  },
  es: {
    moduleTitle: "Visualizador de búsqueda de caminos: BFS, Dijkstra y A* paso a paso · Aleph Labs",
    moduleDescription:
      "Dibuja paredes y barro en una cuadrícula y mira cómo BFS, DFS, Dijkstra, A* y la búsqueda voraz encuentran un camino, paso a paso con el pseudocódigo.",
    raceTitle: "Carrera de búsqueda de caminos: BFS, Dijkstra y A* lado a lado · Aleph Labs",
    raceDescription:
      "Haz competir a BFS, DFS, Dijkstra, A* y la búsqueda voraz en la misma cuadrícula. Mira cuál revisa menos celdas y cuál encuentra el camino más barato.",
    // Only acronyms people search for (BFS, DFS) go in brackets.
    name: (title, short) => (/^[A-Z]{2,4}$/.test(short) ? `${title} (${short})` : title),
    algorithmTitle: (name) => `${name}: búsqueda de caminos visualizada · Aleph Labs`,
    algorithmDescription: (title) =>
      `Mira cómo ${title} encuentra un camino: dibuja paredes y barro en una cuadrícula y sigue cada paso, con el pseudocódigo y su explicación.`,
    section: "Búsqueda de caminos",
  },
});

const graphText = localized({
  en: {
    moduleTitle: "Graph Algorithm Visualizer: BFS, Dijkstra, Prim, Kruskal Step by Step · Aleph Labs",
    moduleDescription:
      "Watch BFS, DFS, Dijkstra, Prim, Kruskal and topological sort on a graph you can reshape, with the queue, the stack and every distance shown as they change.",
    algorithmTitle: (name: string) => `${name} on a Graph, Visualized · Aleph Labs`,
    algorithmDescription: (title: string, structure: string) =>
      `See how ${title} walks a graph: drag nodes, join them, pick the start, then follow its ${structure.toLowerCase()} step by step with the pseudocode.`,
    raceTitle: "Graph Algorithm Race: Prim vs Kruskal, BFS vs DFS · Aleph Labs",
    raceDescription:
      "Race BFS, DFS, Dijkstra, Prim, Kruskal and topological sort on the same graph, one step per tick. See which has the least to do, and how Prim and Kruskal reach the same tree.",
    section: "Graphs",
    onAGraph: (title: string) => `${title} on a graph`,
  },
  es: {
    moduleTitle: "Visualizador de algoritmos de grafos: BFS, Dijkstra, Prim y Kruskal paso a paso · Aleph Labs",
    moduleDescription:
      "Mira BFS, DFS, Dijkstra, Prim, Kruskal y el orden topológico sobre un grafo que puedes modificar, con la cola, la pila y cada distancia a la vista mientras cambian.",
    algorithmTitle: (name) => `${name} en un grafo, visualizado · Aleph Labs`,
    algorithmDescription: (title, structure) =>
      `Mira cómo ${title} recorre un grafo: arrastra nodos, únelos, elige el inicio y sigue cada paso con el pseudocódigo (${structure.toLowerCase()}).`,
    raceTitle: "Carrera de algoritmos de grafos: Prim contra Kruskal, BFS contra DFS · Aleph Labs",
    raceDescription:
      "Haz competir a BFS, DFS, Dijkstra, Prim, Kruskal y el orden topológico en el mismo grafo, un paso por tic. Mira cuál tiene menos trabajo y cómo Prim y Kruskal llegan al mismo árbol.",
    section: "Grafos",
    onAGraph: (title) => `${title} en un grafo`,
  },
});

const structureText = localized({
  en: {
    moduleTitle: "Data Structure Visualizer: BST, AVL Tree, Heap, Hash Table · Aleph Labs",
    moduleDescription:
      "Insert, search and delete in a binary search tree, an AVL tree, a min-heap or a hash table, and watch every comparison, rotation, swap and probe, step by step with the pseudocode.",
    algorithmTitle: (title: string) => `${title} Visualized: Insert, Search, Delete · Aleph Labs`,
    raceTitle: "BST vs AVL Tree: Why Balancing Matters · Aleph Labs",
    raceDescription:
      "The same values into a plain binary search tree and an AVL tree, side by side. Sorted input turns the BST into a list; the AVL tree rotates to stay short.",
    section: "Data structures",
  },
  es: {
    moduleTitle: "Visualizador de estructuras de datos: BST, árbol AVL, montículo y tabla hash · Aleph Labs",
    moduleDescription:
      "Inserta, busca y borra en un árbol binario de búsqueda, un árbol AVL, un montículo mínimo o una tabla hash, y mira cada comparación, rotación, intercambio y sondeo paso a paso.",
    algorithmTitle: (title) => `${title} paso a paso: insertar, buscar, borrar · Aleph Labs`,
    raceTitle: "BST contra árbol AVL: por qué importa balancear · Aleph Labs",
    raceDescription:
      "Los mismos valores en un árbol binario de búsqueda simple y en un árbol AVL, lado a lado. Una entrada ordenada vuelve el BST una lista; el árbol AVL rota para mantenerse bajo.",
    section: "Estructuras de datos",
  },
});

const dpText = localized({
  en: {
    moduleTitle: "Dynamic Programming Visualizer: Edit Distance, LCS, Knapsack · Aleph Labs",
    moduleDescription:
      "Watch a dynamic programming table fill cell by cell, then walk back from the corner to the answer: the edits between two words, what they share, or what fits in a bag.",
    raceTitle: "Recursion vs Memoization vs Table: Dynamic Programming Race · Aleph Labs",
    raceDescription:
      "One knapsack solved three ways side by side: plain recursion redoing the same subproblems, memoized recursion, and the bottom-up table. Count the work each does.",
    problemTitle: (title: string) => `${title} Visualized: The Dynamic Programming Table · Aleph Labs`,
    section: "Dynamic programming",
  },
  es: {
    moduleTitle: "Visualizador de programación dinámica: distancia de edición, LCS y mochila · Aleph Labs",
    moduleDescription:
      "Mira cómo se llena una tabla de programación dinámica celda por celda y vuelve desde la esquina hasta la respuesta: las ediciones entre dos palabras, lo que comparten o lo que cabe en una mochila.",
    raceTitle: "Recursión contra memoización contra tabla: carrera de programación dinámica · Aleph Labs",
    raceDescription:
      "Una mochila resuelta de tres formas lado a lado: la recursión simple que rehace los mismos subproblemas, la recursión con memoización y la tabla. Cuenta el trabajo de cada una.",
    problemTitle: (title) => `${title}: la tabla de programación dinámica, paso a paso · Aleph Labs`,
    section: "Programación dinámica",
  },
});

const fourierText = localized({
  en: {
    moduleTitle: "Fourier Series Visualizer: Waves and Drawings from Circles · Aleph Labs",
    moduleDescription:
      "Build a square, sawtooth or triangle wave from turning circles, or watch circles on circles retrace constellations, drawings or your own. See the fit improve with every circle.",
    epicyclesTitle: "Fourier Epicycles: Draw Any Shape with Circles · Aleph Labs",
    seriesTitle: (title: string) => `${title} Fourier Series, Visualized with Circles · Aleph Labs`,
    section: "Fourier series",
  },
  es: {
    moduleTitle: "Visualizador de series de Fourier: ondas y dibujos hechos con círculos · Aleph Labs",
    moduleDescription:
      "Construye una onda cuadrada, de sierra o triangular con círculos que giran, o mira círculos sobre círculos volver a trazar constelaciones, dibujos o el tuyo. El ajuste mejora con cada círculo.",
    epicyclesTitle: "Epiciclos de Fourier: dibuja cualquier forma con círculos · Aleph Labs",
    seriesTitle: (title) => `${title}: serie de Fourier visualizada con círculos · Aleph Labs`,
    section: "Series de Fourier",
  },
});

const backtrackingText = localized({
  en: {
    moduleTitle: "Backtracking Visualizer: N-Queens and Sudoku Step by Step · Aleph Labs",
    moduleDescription:
      "Watch backtracking place N queens on a chessboard and fill in a Sudoku: every choice, every conflict, every dead end and every backtrack, step by step with the pseudocode.",
    problemTitle: (title: string) => `${title} Backtracking, Visualized Step by Step · Aleph Labs`,
    section: "Backtracking",
  },
  es: {
    moduleTitle: "Visualizador de backtracking: N reinas y sudoku paso a paso · Aleph Labs",
    moduleDescription:
      "Mira cómo el backtracking coloca N reinas en un tablero y llena un sudoku: cada elección, cada conflicto, cada callejón sin salida y cada vuelta atrás, paso a paso con el pseudocódigo.",
    problemTitle: (title) => `${title} con backtracking, visualizado paso a paso · Aleph Labs`,
    section: "Backtracking",
  },
});

const homeText = localized({
  en: {
    title: "Algorithm Visualizer: Sorting, Graphs, Data Structures, DP and More · Aleph Labs",
    description:
      "Watch sorts, A*, Dijkstra, AVL rotations, hash tables, Fourier circles and dynamic programming tables work step by step, with pseudocode and plain-language explanations.",
    appName: "Algorithm Visualizer",
    root: "Algorithms",
  },
  es: {
    title: "Visualizador de algoritmos: ordenamiento, grafos, estructuras de datos, PD y más · Aleph Labs",
    description:
      "Mira paso a paso ordenamientos, A*, Dijkstra, rotaciones AVL, tablas hash, círculos de Fourier y tablas de programación dinámica, con pseudocódigo y explicaciones simples.",
    appName: "Visualizador de algoritmos",
    root: "Algoritmos",
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

export const pageMeta = (route: Route): PageMeta => {
  const path = href(route);
  const url = SITE_URL + (path === "/" ? "/" : path);

  if (route.kind === "home") {
    return {
      path,
      url,
      title: homeText.title,
      description: homeText.description,
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
      title: pathText.moduleTitle,
      description: pathText.moduleDescription,
    };
  }
  if (route.kind === "graphs") {
    return {
      path,
      url,
      title: graphText.moduleTitle,
      description: graphText.moduleDescription,
    };
  }
  if (route.kind === "graph") {
    const { title, short, structure } = graphAlgorithms[route.algorithm];
    // Acronyms people search for (BFS, DFS) go in brackets; other short names don't.
    const name = /^[A-Z]{2,4}$/.test(short) ? `${title} (${short})` : title;
    return {
      path,
      url,
      title: graphText.algorithmTitle(name),
      description: graphText.algorithmDescription(graphAlgorithms[route.algorithm].named, structure),
    };
  }
  if (route.kind === "structures") {
    return {
      path,
      url,
      title: structureText.moduleTitle,
      description: structureText.moduleDescription,
    };
  }
  if (route.kind === "structure") {
    const { title, shortDescription } = structures[route.algorithm];
    return {
      path,
      url,
      title: structureText.algorithmTitle(title),
      description: shortDescription.slice(0, 200),
    };
  }
  if (route.kind === "structureRace") {
    return {
      path,
      url,
      title: structureText.raceTitle,
      description: structureText.raceDescription,
    };
  }
  if (route.kind === "fourier") {
    return {
      path,
      url,
      title: fourierText.moduleTitle,
      description: fourierText.moduleDescription,
    };
  }
  if (route.kind === "series") {
    const { title, shortDescription } = fourierSeries[route.algorithm];
    return {
      path,
      url,
      title:
        route.algorithm === "epicycles" ? fourierText.epicyclesTitle : fourierText.seriesTitle(title),
      description: shortDescription.slice(0, 200),
    };
  }
  if (route.kind === "graphRace") {
    return {
      path,
      url,
      title: graphText.raceTitle,
      description: graphText.raceDescription,
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
      title: pathText.raceTitle,
      description: pathText.raceDescription,
    };
  }
  if (route.kind === "dp") {
    return {
      path,
      url,
      title: dpText.moduleTitle,
      description: dpText.moduleDescription,
    };
  }
  if (route.kind === "dpRace") {
    return {
      path,
      url,
      title: dpText.raceTitle,
      description: dpText.raceDescription,
    };
  }
  if (route.kind === "dpProblem") {
    const { title, shortDescription } = dpProblems[route.algorithm];
    return {
      path,
      url,
      title: dpText.problemTitle(title),
      description: shortDescription.slice(0, 200),
    };
  }
  if (route.kind === "backtracking") {
    return {
      path,
      url,
      title: backtrackingText.moduleTitle,
      description: backtrackingText.moduleDescription,
    };
  }
  if (route.kind === "backtrackingProblem") {
    const { title, shortDescription } = backtrackingProblems[route.algorithm];
    return {
      path,
      url,
      title: backtrackingText.problemTitle(title),
      description: shortDescription.slice(0, 200),
    };
  }
  if (route.kind === "path") {
    const { title, short } = pathAlgorithms[route.algorithm];
    return {
      path,
      url,
      title: pathText.algorithmTitle(pathText.name(title, short)),
      description: pathText.algorithmDescription(pathAlgorithms[route.algorithm].named),
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
  const module = moduleOf(route) ?? "sorting";
  const sectionNames = {
    sorting: sortingText.section,
    pathfinding: pathText.section,
    graphs: graphText.section,
    fourier: fourierText.section,
    structures: structureText.section,
    dp: dpText.section,
    backtracking: backtrackingText.section,
  };
  const sectionRoutes = {
    sorting: { kind: "sorting" },
    pathfinding: { kind: "pathfinding" },
    graphs: { kind: "graphs" },
    fourier: { kind: "fourier" },
    structures: { kind: "structures" },
    dp: { kind: "dp" },
    backtracking: { kind: "backtracking" },
  } as const;
  const section = { name: sectionNames[module], url: `${SITE_URL}${href(sectionRoutes[module])}` };
  const name =
    route.kind === "race" ||
    route.kind === "pathRace" ||
    route.kind === "graphRace" ||
    route.kind === "structureRace" ||
    route.kind === "dpRace"
      ? sortingText.race
      : route.kind === "path"
        ? pathAlgorithms[route.algorithm].title
        : route.kind === "graph"
          ? graphText.onAGraph(graphAlgorithms[route.algorithm].title)
          : route.kind === "series"
            ? fourierSeries[route.algorithm].title
            : route.kind === "structure"
              ? structures[route.algorithm].title
            : route.kind === "dpProblem"
              ? dpProblems[route.algorithm].title
            : route.kind === "backtrackingProblem"
              ? backtrackingProblems[route.algorithm].title
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
