import { localized } from "@/i18n";
import type { ModuleManifest } from "@/routes";
import { mazeAlgorithms } from "./algorithms";
import { MAZE_ALGORITHMS, type MazeAlgorithm } from "./types";

const text = localized({
  en: {
    title: "Mazes",
    summary:
      "A perfect maze carved one decision at a time by randomized depth-first search: every carve, every backtrack and every dead-end cell.",
    count: (n: number) => (n === 1 ? "1 algorithm" : `${n} algorithms`),
    moduleTitle: "Maze Generation Visualizer: a Maze Carved Step by Step · Aleph Labs",
    moduleDescription:
      "Watch depth-first search, Prim's, Kruskal's and Wilson's algorithms carve a perfect maze one decision at a time: every carve, backtrack, skipped wall, random walk and dead-end cell.",
    algorithmTitle: (title: string) => `${title} Maze Generation, Visualized Step by Step · Aleph Labs`,
    section: "Mazes",
    raceTitle: "Maze Generators Side by Side: DFS vs Prim vs Kruskal vs Wilson · Aleph Labs",
    raceDescription:
      "Up to four maze generators carve the same seed side by side. Count the dead-end cells to see each maze's texture: long corridors or many short branches.",
    about: "About maze generation",
    howItWorks: (title: string) => `How ${title} works`,
    race: "How the race works",
  },
  es: {
    title: "Laberintos",
    summary:
      "Un laberinto perfecto excavado decisión por decisión con la búsqueda en profundidad aleatoria: cada pasillo, cada retroceso y cada celda sin salida.",
    count: (n) => (n === 1 ? "1 algoritmo" : `${n} algoritmos`),
    moduleTitle: "Visualizador de generación de laberintos paso a paso · Aleph Labs",
    moduleDescription:
      "Mira cómo la búsqueda en profundidad y los algoritmos de Prim, Kruskal y Wilson excavan un laberinto perfecto paso a paso: cada pasillo, retroceso, pared omitida, caminata al azar y celda sin salida.",
    algorithmTitle: (title) => `${title}: generación de laberintos paso a paso, visualizada · Aleph Labs`,
    section: "Laberintos",
    raceTitle: "Generadores de laberintos lado a lado: DFS, Prim, Kruskal y Wilson · Aleph Labs",
    raceDescription:
      "Hasta cuatro generadores excavan la misma semilla lado a lado. Cuenta las celdas sin salida para ver la textura: pasillos largos o muchas ramas cortas.",
    about: "Sobre la generación de laberintos",
    howItWorks: (title) => `Cómo funciona ${title}`,
    race: "Cómo funciona la carrera",
  },
});

/** Mazes' pages, what search engines and hints say on them, and its landing card. */
export const mazesManifest = {
  pages: {
    base: "/mazes",
    slugs: {
      dfs: "dfs",
      prim: "prim",
      kruskal: "kruskal",
      wilson: "wilson",
    },
    race: true,
  },
  translated: true,
  landing: { title: text.title, summary: text.summary, count: text.count(MAZE_ALGORITHMS.length) },
  seo: {
    section: text.section,
    start: { title: text.moduleTitle, description: text.moduleDescription },
    race: { title: text.raceTitle, description: text.raceDescription },
    algorithm: (algorithm: MazeAlgorithm) => {
      const { title, shortDescription } = mazeAlgorithms[algorithm];
      return { title: text.algorithmTitle(title), description: shortDescription.slice(0, 200), crumb: title };
    },
  },
  hints: {
    start: text.about,
    algorithm: (algorithm: MazeAlgorithm) => text.howItWorks(mazeAlgorithms[algorithm].named),
    race: text.race,
  },
  example: { algorithm: "dfs", search: "?size=large&seed=93ci&race=prim%2Cwilson&speed=2x" },
} as const satisfies ModuleManifest<MazeAlgorithm>;
