import { PathFacts } from "./PathFacts";
import { PathStage } from "./PathStage";
import { PathLegend, PathStatsInline, PathTools } from "./PathTools";
import { PathRaceLanes } from "./PathRaceLanes";
import { PathSettings } from "./Settings";
import { pathAlgorithms, pathTraits, raceDescription } from "./algorithms";
import { gridSizeLabels, presetLabel } from "./labels";
import { pathPseudocode } from "./searches";
import type { PathAlgorithm } from "./types";
import { localized } from "@/i18n";
import { selectGameUnavailable, selectPathFrame, useStore } from "@/store";
import { narratePath } from "./narrate";
import { pathfindingTour } from "./tour";
import type { ModuleUI } from "@/modules/types";

const text = localized({
  en: {
    title: "Pathfinding",
    grid: (size: string, layout: string) => `${size} grid, ${layout}`,
    newRun: "New layout",
    tagline: "Same grid, same clock",
    unit: { one: "cell", short: "cells" },
    smallGrid: "Switch to the small grid",
  },
  es: {
    title: "Búsqueda de caminos",
    grid: (size, layout) => `Cuadrícula ${size.toLowerCase()}, ${layout}`,
    newRun: "Nueva disposición",
    tagline: "Misma cuadrícula, mismo reloj",
    unit: { one: "celda", short: "celdas" },
    smallGrid: "Cambiar a la cuadrícula pequeña",
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
  // Cells too small for guess mode's letters: the small grid has the biggest.
  gameFix: (s) =>
    s.pathfinding.gridSize === "small" || !selectGameUnavailable(s)
      ? null
      : {
          label: text.smallGrid,
          apply: () => {
            const { actions, setView } = useStore.getState();
            actions.pathfinding.setGridSize("small");
            setView("guess");
          },
        },

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
    description: raceDescription,
    unit: text.unit,
  },

  code: {
    lines: (s) => pathPseudocode[s.pathfinding.algorithm],
    line: (s) => selectPathFrame(s).line,
    narrate: (s, index) => narratePath(s.pathfinding.run, Math.min(index, s.pathfinding.run.length - 1), s.pathfinding.algorithm),
  },

  tour: pathfindingTour,
};
