// eslint-disable-next-line house/module-boundaries -- TODO(#190): sorting's race text moves into its module.
import { RACE_DESCRIPTION } from "@/consts/race";
import { localized } from "@/i18n";
import type { ModuleManifest } from "@/routes";
import { sortingAlgorithms } from "./algorithms";
import type { Algorithm } from "./types";

const text = localized({
  en: {
    title: "Sorting",
    summary: "Selection, Insertion, Bubble, Cocktail, Shell, Quick, Merge, Heap and Radix Sort.",
    count: (n: number) => (n === 1 ? "1 algorithm" : `${n} algorithms`),
    moduleTitle: "Sorting Algorithm Visualizer: 9 Algorithms Step by Step · Aleph Labs",
    moduleDescription:
      "Watch Bubble, Insertion, Quick, Merge, Heap, Radix Sort and more sort an array step by step, with the pseudocode lit up and every move explained.",
    raceTitle: "Sorting Algorithm Race: Compare Algorithms Side by Side · Aleph Labs",
    raceDescription: (description: string) => `Race up to four sorting algorithms on the same array. ${description}`.slice(0, 160),
    algorithmTitle: (title: string) => `${title} Visualized Step by Step · Aleph Labs`,
    algorithmDescription: (title: string, average: string) =>
      `See how ${title} works: watch it sort an array step by step, follow the pseudocode line by line and compare it with other algorithms. ${average} on average.`,
    section: "Sorting",
    about: "About sorting algorithms",
    howItWorks: (title: string) => `How ${title} works`,
    race: "How the race works",
  },
  es: {
    title: "Ordenamiento",
    summary: "Selection, Insertion, Bubble, Cocktail, Shell, Quick, Merge, Heap y Radix Sort.",
    count: (n) => (n === 1 ? "1 algoritmo" : `${n} algoritmos`),
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
    about: "Sobre los algoritmos de ordenamiento",
    howItWorks: (title) => `Cómo funciona ${title}`,
    race: "Cómo funciona la carrera",
  },
});

/** Sorting's pages, what search engines and hints say on them, and its landing card. */
export const sortingManifest = {
  pages: {
    base: "/sorting",
    slugs: {
      selection: "selection-sort",
      insertion: "insertion-sort",
      bubble: "bubble-sort",
      cocktail: "cocktail-shaker-sort",
      shell: "shell-sort",
      quick: "quick-sort",
      merge: "merge-sort",
      heap: "heap-sort",
      radix: "radix-sort",
    },
    race: true,
  },
  translated: true,
  landing: { title: text.title, summary: text.summary, count: text.count(Object.keys(sortingAlgorithms).length) },
  seo: {
    section: text.section,
    start: { title: text.moduleTitle, description: text.moduleDescription },
    race: { title: text.raceTitle, description: text.raceDescription(RACE_DESCRIPTION) },
    algorithm: (algorithm: Algorithm) => {
      const { title, timeComplexity } = sortingAlgorithms[algorithm];
      return {
        title: text.algorithmTitle(title),
        description: text.algorithmDescription(title, timeComplexity.average),
        crumb: title,
      };
    },
  },
  hints: {
    start: text.about,
    algorithm: (algorithm: Algorithm) => text.howItWorks(sortingAlgorithms[algorithm].title),
    race: text.race,
  },
  example: { algorithm: "heap", search: "?size=40&input=reversed&mode=bars&speed=2x&seed=9ix&race=insertion%2Cquick%2Cmerge" },
} as const satisfies ModuleManifest<Algorithm>;
