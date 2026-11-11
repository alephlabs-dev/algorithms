import { localized } from "@/i18n";
import type { ModuleManifest } from "@/routes";
import { structures } from "./algorithms";
import type { StructureAlgorithm } from "./types";

const text = localized({
  en: {
    title: "Data structures",
    summary: "Search trees, AVL rotations, a min-heap and hash tables you insert into, search and delete from.",
    count: (n: number) => `${n} structures`,
    moduleTitle: "Data Structure Visualizer: BST, AVL Tree, Heap, Hash Table",
    moduleDescription:
      "Insert, search and delete in a binary search tree, an AVL tree, a min-heap or a hash table, and watch every comparison, rotation, swap and probe, step by step with the pseudocode.",
    algorithmTitle: (title: string) => `${title} Visualized: Insert, Search, Delete`,
    raceTitle: "BST vs AVL Tree: Why Balancing Matters",
    raceDescription:
      "The same values into a plain binary search tree and an AVL tree, side by side. Sorted input turns the BST into a list; the AVL tree rotates to stay short.",
    section: "Data structures",
    about: "About these data structures",
    structure: (named: string) => `the ${named}`,
    balancing: "Why balancing matters",
  },
  es: {
    title: "Estructuras de datos",
    summary: "Árboles de búsqueda, rotaciones AVL, un montículo mínimo y tablas hash donde insertas, buscas y borras.",
    count: (n) => `${n} estructuras`,
    moduleTitle: "Visualizador de estructuras de datos: BST, árbol AVL, montículo y tabla hash",
    moduleDescription:
      "Inserta, busca y borra en un árbol binario de búsqueda, un árbol AVL, un montículo mínimo o una tabla hash, y mira cada comparación, rotación, intercambio y sondeo paso a paso.",
    algorithmTitle: (title) => `${title} paso a paso: insertar, buscar, borrar`,
    raceTitle: "BST contra árbol AVL: por qué importa balancear",
    raceDescription:
      "Los mismos valores en un árbol binario de búsqueda simple y en un árbol AVL, lado a lado. Una entrada ordenada vuelve el BST una lista; el árbol AVL rota para mantenerse bajo.",
    section: "Estructuras de datos",
    about: "Sobre estas estructuras de datos",
    structure: (named) => named,
    balancing: "Por qué importa balancear",
  },
});

/** Data structures' pages, what search engines and hints say on them, and its landing card. */
export const structuresManifest = {
  pages: {
    base: "/structures",
    slugs: {
      bst: "binary-search-tree",
      avl: "avl-tree",
      heap: "min-heap",
      chaining: "hash-table-chaining",
      probing: "hash-table-linear-probing",
    },
    race: true,
  },
  translated: true,
  landing: { title: text.title, summary: text.summary, count: text.count(Object.keys(structures).length) },
  seo: {
    section: text.section,
    start: { title: text.moduleTitle, description: text.moduleDescription },
    race: { title: text.raceTitle, description: text.raceDescription },
    algorithm: (algorithm: StructureAlgorithm) => {
      const { title, shortDescription } = structures[algorithm];
      return { title: text.algorithmTitle(title), description: shortDescription.slice(0, 200), crumb: title };
    },
  },
  hints: {
    start: text.about,
    works: (algorithm: StructureAlgorithm) => text.structure(structures[algorithm].named),
    race: text.balancing,
  },
  example: { algorithm: "avl", search: "?ops=i10.i20&values=medium&order=ascending&speed=2x" },
} as const satisfies ModuleManifest<StructureAlgorithm>;
