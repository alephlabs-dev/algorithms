import type { GraphPreset, GraphSize } from "@/graphs";

/** The ready-made layouts, in the order the buttons show them. */
export const graphPresetOptions: { value: GraphPreset; label: string; title: string }[] = [
  { value: "random", label: "Network", title: "Scattered nodes joined by short edges, with a few loops" },
  { value: "tree", label: "Tree", title: "A tree: exactly one way between any two nodes" },
  { value: "grid", label: "Grid", title: "A lattice with some links missing" },
];

export const graphSizeLabels: Record<GraphSize, string> = {
  small: "Few nodes",
  medium: "Some nodes",
  large: "Many nodes",
};

export const graphPresetLabel = (preset: GraphPreset) => graphPresetOptions.find((p) => p.value === preset)!.label;
