import { localized } from "@/i18n";
import type { ModuleManifest } from "@/routes";
import { dpProblems } from "./algorithms";
import type { DpAlgorithm } from "./types";

const text = localized({
  en: {
    title: "Dynamic programming",
    summary:
      "Edit distance, the longest common subsequence and the knapsack, one table cell at a time, and a race against plain recursion.",
    count: (n: number) => (n === 1 ? "1 problem" : `${n} problems`),
    moduleTitle: "Dynamic Programming Visualizer: Edit Distance, LCS, Knapsack",
    moduleDescription:
      "Watch a dynamic programming table fill cell by cell, then walk back from the corner to the answer: the edits between two words, what they share, or what fits in a bag.",
    raceTitle: "Recursion vs Memoization vs Table: Dynamic Programming Race",
    raceDescription:
      "One knapsack solved three ways side by side: plain recursion redoing the same subproblems, memoized recursion, and the bottom-up table. Count the work each does.",
    problemTitle: (title: string) => `${title} Visualized: The Dynamic Programming Table`,
    section: "Dynamic programming",
    about: "About dynamic programming",
    problem: (named: string) => named.toLowerCase(),
    race: "What memoizing saves",
  },
  es: {
    title: "Programación dinámica",
    summary:
      "Distancia de edición, la subsecuencia común más larga y la mochila, celda por celda, y una carrera contra la recursión simple.",
    count: (n) => (n === 1 ? "1 problema" : `${n} problemas`),
    moduleTitle: "Visualizador de programación dinámica: distancia de edición, LCS y mochila",
    moduleDescription:
      "Mira cómo se llena una tabla de programación dinámica celda por celda y vuelve desde la esquina hasta la respuesta: las ediciones entre dos palabras, lo que comparten o lo que cabe en una mochila.",
    raceTitle: "Recursión contra memoización contra tabla: carrera de programación dinámica",
    raceDescription:
      "Una mochila resuelta de tres formas lado a lado: la recursión simple que rehace los mismos subproblemas, la recursión con memoización y la tabla. Cuenta el trabajo de cada una.",
    problemTitle: (title) => `${title}: la tabla de programación dinámica, paso a paso`,
    section: "Programación dinámica",
    about: "Sobre la programación dinámica",
    problem: (named) => named,
    race: "Lo que ahorra memorizar",
  },
});

/** Dynamic programming's pages, what search engines and hints say on them, and its landing card. */
export const dpManifest = {
  pages: {
    base: "/dynamic-programming",
    slugs: {
      edit: "edit-distance",
      lcs: "longest-common-subsequence",
      knapsack: "knapsack",
    },
    race: true,
  },
  translated: true,
  landing: { title: text.title, summary: text.summary, count: text.count(Object.keys(dpProblems).length) },
  seo: {
    section: text.section,
    start: { title: text.moduleTitle, description: text.moduleDescription },
    race: { title: text.raceTitle, description: text.raceDescription },
    algorithm: (algorithm: DpAlgorithm) => {
      const { title, shortDescription } = dpProblems[algorithm];
      return { title: text.problemTitle(title), description: shortDescription.slice(0, 200), crumb: title };
    },
  },
  hints: {
    start: text.about,
    works: (algorithm: DpAlgorithm) => text.problem(dpProblems[algorithm].named),
    race: text.race,
  },
  example: { algorithm: "lcs", search: "?a=KITTEN&b=SITTING&items=3x4.4x5&cap=7&speed=2x" },
} as const satisfies ModuleManifest<DpAlgorithm>;
