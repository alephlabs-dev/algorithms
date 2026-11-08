import { PathFacts } from "@/components/Pathfinding/PathFacts";
import { PathStage } from "@/components/Pathfinding/PathStage";
import { PathLegend, PathStatsInline, PathTools } from "@/components/Pathfinding/PathTools";
import { PathRaceLanes } from "@/components/Race/PathRaceLanes";
import { PathSettings } from "@/components/Settings/SettingsPanel";
import { pathAlgorithms, pathTraits } from "@/consts/pathAlgorithms";
import { gridSizeLabels, presetLabel } from "@/consts/pathLabels";
import { PATH_RACE_DESCRIPTION } from "@/consts/race";
import { pathPseudocode, type PathAlgorithm } from "@/pathfinding";
import { localized } from "@/i18n";
import { selectPathFrame, useStore } from "@/store";
import { narratePath } from "@/utils/narratePath";
import { pathfindingTour } from "./tours";
import type { ModuleUI } from "./types";

const text = localized({
  en: {
    title: "Pathfinding",
    grid: (size: string, layout: string) => `${size} grid, ${layout}`,
    newRun: "New layout",
    tagline: "Same grid, same clock",
    unit: { one: "cell", short: "cells" },
  },
  es: {
    title: "Búsqueda de caminos",
    grid: (size, layout) => `Cuadrícula ${size.toLowerCase()}, ${layout}`,
    newRun: "Nueva disposición",
    tagline: "Misma cuadrícula, mismo reloj",
    unit: { one: "celda", short: "celdas" },
  },
});

export const pathfindingUI: ModuleUI = {
  id: "pathfinding",
  title: text.title,

  Stage: PathStage,
  // Editing the grid is the point, so the brush and layouts sit right above it.
  Tools: PathTools,
  Legend: PathLegend,
  Stats: PathStatsInline,
  Settings: PathSettings,
  Facts: PathFacts,

  settingsSummary: (s) => {
    const size = gridSizeLabels[s.pathfinding.gridSize];
    const layout = presetLabel(s.pathfinding.gridPreset);
    return { main: size, detail: layout, label: text.grid(size, layout) };
  },
  newRunLabel: text.newRun,

  algorithms: [
    {
      items: (Object.keys(pathAlgorithms) as PathAlgorithm[]).map((id) => ({
        id,
        title: pathAlgorithms[id].title,
        short: pathAlgorithms[id].short,
      })),
    },
  ],
  current: (s) => s.pathfinding.algorithm,
  pick: (id) => useStore.getState().pick("pathfinding", id as PathAlgorithm),

  about: (s) => pathAlgorithms[s.pathfinding.algorithm],
  summary: (s) => pathTraits(s.pathfinding.algorithm),
  race: {
    Stage: PathRaceLanes,
    racers: (s) => s.pathfinding.racers,
    toggleRacer: (id) => useStore.getState().actions.pathfinding.toggleRacer(id as PathAlgorithm),
    tagline: text.tagline,
    description: PATH_RACE_DESCRIPTION,
    unit: text.unit,
  },

  code: {
    lines: (s) => pathPseudocode[s.pathfinding.algorithm],
    line: (s) => selectPathFrame(s).line,
    narrate: (s, index) => narratePath(s.pathfinding.run, Math.min(index, s.pathfinding.run.length - 1), s.pathfinding.algorithm),
  },

  tour: pathfindingTour,
};
