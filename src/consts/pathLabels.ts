import { localized } from "@/i18n";
import type { Preset } from "@/pathfinding";
import type { GridSize } from "@/utils/gridSize";

/** The ready-made grid layouts, in the order the buttons show them. */
export const presets = localized<{ value: Preset; label: string; title: string }[]>({
  en: [
    { value: "maze", label: "Maze", title: "Carve a new maze" },
    { value: "walls", label: "Walls", title: "Scatter random walls" },
    { value: "terrain", label: "Terrain", title: "Patches of mud and a few walls: where costs matter" },
    { value: "clear", label: "Clear", title: "Remove every wall and mud cell" },
  ],
  es: [
    { value: "maze", label: "Laberinto", title: "Excava un laberinto nuevo" },
    { value: "walls", label: "Paredes", title: "Reparte paredes al azar" },
    { value: "terrain", label: "Terreno", title: "Manchas de barro y algunas paredes: donde importan los costos" },
    { value: "clear", label: "Vaciar", title: "Quita todas las paredes y el barro" },
  ],
});

export const gridSizeLabels = localized<Record<GridSize, string>>({
  en: { small: "Small", medium: "Medium", large: "Large" },
  es: { small: "Pequeña", medium: "Mediana", large: "Grande" },
});

export const presetLabel = (preset: Preset) => presets.find((p) => p.value === preset)!.label;
