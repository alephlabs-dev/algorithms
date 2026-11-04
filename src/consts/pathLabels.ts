import type { GridSize, Preset } from "@/pathfinding";

/** The ready-made grid layouts, in the order the buttons show them. */
export const presets: { value: Preset; label: string; title: string }[] = [
  { value: "maze", label: "Maze", title: "Carve a new maze" },
  { value: "walls", label: "Walls", title: "Scatter random walls" },
  { value: "terrain", label: "Terrain", title: "Patches of mud and a few walls: where costs matter" },
  { value: "clear", label: "Clear", title: "Remove every wall and mud cell" },
];

export const gridSizeLabels: Record<GridSize, string> = { small: "Small", medium: "Medium", large: "Large" };

export const presetLabel = (preset: Preset) => presets.find((p) => p.value === preset)!.label;
