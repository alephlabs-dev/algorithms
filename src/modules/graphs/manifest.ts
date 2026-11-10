import { localized } from "@/i18n";
import type { ModuleManifest } from "@/routes";
import { graphAlgorithms } from "./algorithms";
import type { GraphAlgorithm } from "./types";

const text = localized({
  en: {
    title: "Graphs",
    summary: "BFS, DFS, Dijkstra, Prim, Kruskal and topological sort on a graph you can reshape.",
    count: (n: number) => `${n} algorithms`,
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
    about: "About graph algorithms",
    howItWorks: (title: string) => `How ${title} works`,
    race: "How the race works",
  },
  es: {
    title: "Grafos",
    summary: "BFS, DFS, Dijkstra, Prim, Kruskal y orden topológico en un grafo que puedes modificar.",
    count: (n) => `${n} algoritmos`,
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
    about: "Sobre los algoritmos de grafos",
    howItWorks: (title) => `Cómo funciona ${title}`,
    race: "Cómo funciona la carrera",
  },
});

/** Graphs' pages, what search engines and hints say on them, and its landing card. */
export const graphsManifest = {
  pages: {
    base: "/graphs",
    slugs: {
      bfs: "breadth-first-search",
      dfs: "depth-first-search",
      dijkstra: "dijkstra",
      prim: "prim",
      kruskal: "kruskal",
      topo: "topological-sort",
    },
    race: true,
  },
  translated: true,
  landing: { title: text.title, summary: text.summary, count: text.count(Object.keys(graphAlgorithms).length) },
  seo: {
    section: text.section,
    start: { title: text.moduleTitle, description: text.moduleDescription },
    race: { title: text.raceTitle, description: text.raceDescription },
    algorithm: (algorithm: GraphAlgorithm) => {
      const { title, short, structure, named } = graphAlgorithms[algorithm];
      // Acronyms people search for (BFS, DFS) go in brackets; other short names don't.
      const name = /^[A-Z]{2,4}$/.test(short) ? `${title} (${short})` : title;
      return {
        title: text.algorithmTitle(name),
        description: text.algorithmDescription(named, structure),
        crumb: text.onAGraph(title),
      };
    },
  },
  hints: {
    start: text.about,
    algorithm: (algorithm: GraphAlgorithm) => text.howItWorks(graphAlgorithms[algorithm].named),
    race: text.race,
  },
  example: {
    algorithm: "dijkstra",
    search:
      "?graph=ArQQAACSLU9ksGTVZB6bQ5uAm7CbyZvhmx7SNtJP0mfSgNKY0g8AAQUAAgkAAwMBBAgBBQcBBgYCBwEDCAUDCQMECgkFCwMFDAcGDQcGDgMGDwE&nodes=large&layout=tree&race=prim%2Ckruskal&speed=2x",
  },
} as const satisfies ModuleManifest<GraphAlgorithm>;
