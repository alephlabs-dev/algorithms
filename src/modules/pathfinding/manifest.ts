import { localized } from "@/i18n";
import type { ModuleManifest } from "@/routes";
import { pathAlgorithms } from "./algorithms";
import type { PathAlgorithm } from "./types";

const text = localized({
  en: {
    title: "Pathfinding",
    summary: "Breadth-first, depth-first, Dijkstra, A* and greedy search, on a grid you draw.",
    count: (n: number) => `${n} searches`,
    moduleTitle: "Pathfinding Visualizer: BFS, Dijkstra and A* Step by Step",
    moduleDescription:
      "Draw walls and mud on a grid, then watch BFS, DFS, Dijkstra, A* and Greedy Best-First Search find a path, step by step with the pseudocode.",
    raceTitle: "Pathfinding Race: BFS vs Dijkstra vs A* Side by Side",
    raceDescription:
      "Race BFS, DFS, Dijkstra, A* and Greedy Best-First Search on the same grid. See which looks at the fewest cells, and which finds the cheapest path.",
    name: (title: string, short: string) => (title.includes(short) ? title : `${title} (${short})`),
    algorithmTitle: (name: string) => `${name} Pathfinding Visualized`,
    algorithmDescription: (title: string) =>
      `See how ${title} finds a path: draw walls and mud on a grid, then watch it search step by step with the pseudocode and every step explained.`,
    section: "Pathfinding",
    about: "About pathfinding algorithms",
  },
  es: {
    title: "Búsqueda de caminos",
    summary: "Búsqueda en anchura, en profundidad, Dijkstra, A* y búsqueda voraz, en una cuadrícula que tú dibujas.",
    count: (n) => `${n} búsquedas`,
    moduleTitle: "Visualizador de búsqueda de caminos: BFS, Dijkstra y A* paso a paso",
    moduleDescription:
      "Dibuja paredes y barro en una cuadrícula y mira cómo BFS, DFS, Dijkstra, A* y la búsqueda voraz encuentran un camino, paso a paso con el pseudocódigo.",
    raceTitle: "Carrera de búsqueda de caminos: BFS, Dijkstra y A* lado a lado",
    raceDescription:
      "Haz competir a BFS, DFS, Dijkstra, A* y la búsqueda voraz en la misma cuadrícula. Mira cuál revisa menos celdas y cuál encuentra el camino más barato.",
    // Only acronyms people search for (BFS, DFS) go in brackets.
    name: (title, short) => (/^[A-Z]{2,4}$/.test(short) ? `${title} (${short})` : title),
    algorithmTitle: (name) => `${name}: búsqueda de caminos visualizada`,
    algorithmDescription: (title) =>
      `Mira cómo ${title} encuentra un camino: dibuja paredes y barro en una cuadrícula y sigue cada paso, con el pseudocódigo y su explicación.`,
    section: "Búsqueda de caminos",
    about: "Sobre los algoritmos de búsqueda de caminos",
  },
});

/** Pathfinding's pages, what search engines and hints say on them, and its landing card. */
export const pathfindingManifest = {
  pages: {
    base: "/pathfinding",
    slugs: {
      bfs: "breadth-first-search",
      dfs: "depth-first-search",
      dijkstra: "dijkstra",
      astar: "a-star",
      greedy: "greedy-best-first-search",
    },
    race: true,
  },
  translated: true,
  landing: { title: text.title, summary: text.summary, count: text.count(Object.keys(pathAlgorithms).length) },
  seo: {
    section: text.section,
    start: { title: text.moduleTitle, description: text.moduleDescription },
    race: { title: text.raceTitle, description: text.raceDescription },
    algorithm: (algorithm: PathAlgorithm) => {
      const { title, short, named } = pathAlgorithms[algorithm];
      return {
        title: text.algorithmTitle(text.name(title, short)),
        description: text.algorithmDescription(named),
        crumb: title,
      };
    },
  },
  hints: {
    start: text.about,
    works: (algorithm: PathAlgorithm) => pathAlgorithms[algorithm].named,
  },
  tourKey: "tour-done-pathfinding",
  example: {
    algorithm: "dijkstra",
    search:
      "?grid=medium&cells=VVVVVVVVVVUFQEAAAAAAABRVEVFVVVFVVQRABAAABABAEVURVVFVURUFQEAABAREABRVUVVREVFRUUAEBABABEBAFVERVRVRFRVFBEAERAQAQBRRVRERUVUVVUBAQEQAQEBAURFVEVFVERVFQEBARABEBBRRFVFRURERUUAAQABAAAREVVVVVVVVVVUB&from=7h&to=83&race=bfs%2Castar&speed=2x",
  },
} as const satisfies ModuleManifest<PathAlgorithm>;
