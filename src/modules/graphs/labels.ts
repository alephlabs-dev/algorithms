import { localized } from "@/i18n";
import type { GraphPreset, GraphSize } from "./graph";

/** The ready-made layouts, in the order the buttons show them. */
export const graphPresetOptions = localized<{ value: GraphPreset; label: string; title: string }[]>({
  en: [
    { value: "random", label: "Network", title: "Scattered nodes joined by short edges, with a few loops" },
    { value: "tree", label: "Tree", title: "A tree: exactly one way between any two nodes" },
    { value: "grid", label: "Grid", title: "A lattice with some links missing" },
    { value: "dag", label: "DAG", title: "A directed graph without loops: every edge points rightwards" },
  ],
  es: [
    { value: "random", label: "Red", title: "Nodos dispersos unidos por aristas cortas, con algunos ciclos" },
    { value: "tree", label: "Árbol", title: "Un árbol: exactamente un camino entre dos nodos cualesquiera" },
    { value: "grid", label: "Malla", title: "Una retícula a la que le faltan algunas conexiones" },
    { value: "dag", label: "DAG", title: "Un grafo dirigido sin ciclos: cada arista apunta hacia la derecha" },
  ],
});

/** The first word is the short form the settings pill shows. */
export const graphSizeLabels = localized<Record<GraphSize, string>>({
  en: { small: "Few nodes", medium: "Some nodes", large: "Many nodes" },
  es: { small: "Pocos nodos", medium: "Algunos nodos", large: "Muchos nodos" },
});

export const graphPresetLabel = (preset: GraphPreset) => graphPresetOptions.find((p) => p.value === preset)!.label;
