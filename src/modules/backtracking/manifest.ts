import { localized } from "@/i18n";
import type { ModuleManifest } from "@/routes";
import { backtrackingProblems } from "./algorithms";
import type { BacktrackingProblem } from "./types";

const text = localized({
  en: {
    title: "Backtracking",
    summary:
      "N queens on a chessboard and a Sudoku, filled one choice at a time: every conflict, every dead end and every choice taken back.",
    count: (n: number) => (n === 1 ? "1 problem" : `${n} problems`),
    moduleTitle: "Backtracking Visualizer: N-Queens and Sudoku Step by Step",
    moduleDescription:
      "Watch backtracking place N queens on a chessboard and fill in a Sudoku: every choice, every conflict, every dead end and every backtrack, step by step with the pseudocode.",
    problemTitle: (title: string) => `${title} Backtracking, Visualized Step by Step`,
    section: "Backtracking",
    about: "About backtracking",
  },
  es: {
    title: "Backtracking",
    summary:
      "N reinas en un tablero de ajedrez y un sudoku, elección por elección: cada conflicto, cada callejón sin salida y cada elección que se deshace.",
    count: (n) => (n === 1 ? "1 problema" : `${n} problemas`),
    moduleTitle: "Visualizador de backtracking: N reinas y sudoku paso a paso",
    moduleDescription:
      "Mira cómo el backtracking coloca N reinas en un tablero y llena un sudoku: cada elección, cada conflicto, cada callejón sin salida y cada vuelta atrás, paso a paso con el pseudocódigo.",
    problemTitle: (title) => `${title} con backtracking, visualizado paso a paso`,
    section: "Backtracking",
    about: "Sobre el backtracking",
  },
});

/** Backtracking's pages, what search engines and hints say on them, and its landing card. */
export const backtrackingManifest = {
  pages: {
    base: "/backtracking",
    slugs: {
      queens: "n-queens",
      sudoku: "sudoku",
    },
    race: false,
  },
  translated: true,
  landing: { title: text.title, summary: text.summary, count: text.count(Object.keys(backtrackingProblems).length) },
  seo: {
    section: text.section,
    start: { title: text.moduleTitle, description: text.moduleDescription },
    algorithm: (algorithm: BacktrackingProblem) => {
      const { title, shortDescription } = backtrackingProblems[algorithm];
      return { title: text.problemTitle(title), description: shortDescription.slice(0, 200), crumb: title };
    },
  },
  hints: {
    start: text.about,
    heading: (algorithm: BacktrackingProblem) => backtrackingProblems[algorithm].howItWorks,
  },
  example: { algorithm: "queens", search: "?n=5&puzzle=easy&speed=2x" },
} as const satisfies ModuleManifest<BacktrackingProblem>;
