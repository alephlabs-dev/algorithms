import { backtrackingProblems } from "@/consts/backtracking";
import { dpProblems } from "@/consts/dp";
import { fourierSeries } from "@/consts/fourierSeries";
import { structures } from "@/consts/structures";
import { graphAlgorithms } from "@/consts/graphAlgorithms";
import { mazeAlgorithms } from "@/consts/mazeAlgorithms";
import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { RACE_DESCRIPTION } from "@/consts/race";
import { localized } from "@/i18n";
import { HOME, href, SITE_URL, type AlgorithmOf, type ModuleId, type RacingModule, type Route } from "@/routes";

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

const mazesText = localized({
  en: {
    moduleTitle: "Maze Generation Visualizer: a Maze Carved Step by Step · Aleph Labs",
    moduleDescription:
      "Watch randomized depth-first search and Prim's algorithm carve a perfect maze one decision at a time: every carve, every backtrack, every pick and every dead-end cell.",
    algorithmTitle: (title: string) => `${title} Maze Generation, Visualized Step by Step · Aleph Labs`,
    section: "Mazes",
  },
  es: {
    moduleTitle: "Visualizador de generación de laberintos paso a paso · Aleph Labs",
    moduleDescription:
      "Mira cómo la búsqueda en profundidad aleatoria y el algoritmo de Prim excavan un laberinto perfecto decisión por decisión: cada pasillo, cada retroceso, cada elección y cada celda sin salida.",
    algorithmTitle: (title) => `${title}: generación de laberintos paso a paso, visualizada · Aleph Labs`,
    section: "Laberintos",
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

type Meta = { title: string; description: string };

type ModuleSeo<M extends ModuleId> = {
  /** The module's name in the breadcrumb trail. */
  section: string;
  start: Meta;
  /** An algorithm page's meta, plus its own name in the breadcrumb trail. */
  algorithm: (algorithm: AlgorithmOf<M>) => Meta & { crumb: string };
} & (M extends RacingModule ? { race: Meta } : unknown);

/** Every module's search metadata, one entry per page. A module or a race page without one fails the typecheck. */
const seo: { [M in ModuleId]: ModuleSeo<M> } = {
  sorting: {
    section: sortingText.section,
    start: { title: sortingText.moduleTitle, description: sortingText.moduleDescription },
    race: { title: sortingText.raceTitle, description: sortingText.raceDescription(RACE_DESCRIPTION) },
    algorithm: (algorithm) => {
      const { title, timeComplexity } = sortingAlgorithms[algorithm];
      return {
        title: sortingText.algorithmTitle(title),
        description: sortingText.algorithmDescription(title, timeComplexity.average),
        crumb: title,
      };
    },
  },
  pathfinding: {
    section: pathText.section,
    start: { title: pathText.moduleTitle, description: pathText.moduleDescription },
    race: { title: pathText.raceTitle, description: pathText.raceDescription },
    algorithm: (algorithm) => {
      const { title, short, named } = pathAlgorithms[algorithm];
      return {
        title: pathText.algorithmTitle(pathText.name(title, short)),
        description: pathText.algorithmDescription(named),
        crumb: title,
      };
    },
  },
  graphs: {
    section: graphText.section,
    start: { title: graphText.moduleTitle, description: graphText.moduleDescription },
    race: { title: graphText.raceTitle, description: graphText.raceDescription },
    algorithm: (algorithm) => {
      const { title, short, structure, named } = graphAlgorithms[algorithm];
      // Acronyms people search for (BFS, DFS) go in brackets; other short names don't.
      const name = /^[A-Z]{2,4}$/.test(short) ? `${title} (${short})` : title;
      return {
        title: graphText.algorithmTitle(name),
        description: graphText.algorithmDescription(named, structure),
        crumb: graphText.onAGraph(title),
      };
    },
  },
  fourier: {
    section: fourierText.section,
    start: { title: fourierText.moduleTitle, description: fourierText.moduleDescription },
    algorithm: (algorithm) => {
      const { title, shortDescription } = fourierSeries[algorithm];
      return {
        title: algorithm === "epicycles" ? fourierText.epicyclesTitle : fourierText.seriesTitle(title),
        description: shortDescription.slice(0, 200),
        crumb: title,
      };
    },
  },
  structures: {
    section: structureText.section,
    start: { title: structureText.moduleTitle, description: structureText.moduleDescription },
    race: { title: structureText.raceTitle, description: structureText.raceDescription },
    algorithm: (algorithm) => {
      const { title, shortDescription } = structures[algorithm];
      return { title: structureText.algorithmTitle(title), description: shortDescription.slice(0, 200), crumb: title };
    },
  },
  dp: {
    section: dpText.section,
    start: { title: dpText.moduleTitle, description: dpText.moduleDescription },
    race: { title: dpText.raceTitle, description: dpText.raceDescription },
    algorithm: (algorithm) => {
      const { title, shortDescription } = dpProblems[algorithm];
      return { title: dpText.problemTitle(title), description: shortDescription.slice(0, 200), crumb: title };
    },
  },
  backtracking: {
    section: backtrackingText.section,
    start: { title: backtrackingText.moduleTitle, description: backtrackingText.moduleDescription },
    algorithm: (algorithm) => {
      const { title, shortDescription } = backtrackingProblems[algorithm];
      return { title: backtrackingText.problemTitle(title), description: shortDescription.slice(0, 200), crumb: title };
    },
  },
  mazes: {
    section: mazesText.section,
    start: { title: mazesText.moduleTitle, description: mazesText.moduleDescription },
    algorithm: (algorithm) => {
      const { title, shortDescription } = mazeAlgorithms[algorithm];
      return { title: mazesText.algorithmTitle(title), description: shortDescription.slice(0, 200), crumb: title };
    },
  },
};

/** A page's meta, and its own name in the breadcrumb trail (a module's start page and the landing page have none). */
const metaOf = (route: Route): Meta & { crumb?: string } => {
  if (route.page === "home") return { title: homeText.title, description: homeText.description };
  const pages = seo[route.module] as {
    start: Meta;
    algorithm: (algorithm: string) => Meta & { crumb: string };
    race?: Meta;
  };
  if (route.page === "algorithm") return pages.algorithm(route.algorithm);
  if (route.page === "race") return { ...pages.race!, crumb: sortingText.race };
  return pages.start;
};

export const pageMeta = (route: Route): PageMeta => {
  const path = href(route);
  const url = SITE_URL + (path === "/" ? "/" : path);
  const { title, description } = metaOf(route);
  return { path, url, title, description };
};

/** Structured data (JSON-LD) so search engines know what each page is. */
export const structuredData = (route: Route): object[] => {
  const meta = pageMeta(route);
  const publisher = { "@type": "Organization", name: "Aleph Labs" };
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
  const section = { name: seo[route.module].section, url: `${SITE_URL}${href({ module: route.module, page: "start" })}` };
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
