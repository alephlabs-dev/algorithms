import { PathFacts } from "@/components/Pathfinding/PathFacts";
import { PathStage } from "@/components/Pathfinding/PathStage";
import { PathLegend, PathStatsInline, PathTools } from "@/components/Pathfinding/PathTools";
import { PathRaceLanes } from "@/components/Race/PathRaceLanes";
import { PathSettings } from "@/components/Settings/SettingsPanel";
import { pathAlgorithms, pathTraits } from "@/consts/pathAlgorithms";
import { gridSizeLabels, presetLabel } from "@/consts/pathLabels";
import { PATH_RACE_DESCRIPTION } from "@/consts/race";
import { pathPseudocode, type PathAlgorithm } from "@/pathfinding";
import { selectPathFrame, useStore } from "@/store";
import { narratePath } from "@/utils/narratePath";
import { pathfindingTour } from "./tours";
import type { ModuleUI } from "./types";

export const pathfindingUI: ModuleUI = {
  id: "pathfinding",
  title: "Pathfinding",

  Stage: PathStage,
  RaceStage: PathRaceLanes,
  // Editing the grid is the point, so the brush and layouts sit right above it.
  Tools: PathTools,
  Legend: PathLegend,
  Stats: PathStatsInline,
  Settings: PathSettings,
  Facts: PathFacts,

  settingsSummary: (s) => {
    const size = gridSizeLabels[s.gridSize];
    const layout = presetLabel(s.gridPreset);
    return { main: size, detail: layout, label: `${size} grid, ${layout}` };
  },
  newRunLabel: "New layout",

  algorithms: [
    {
      items: (Object.keys(pathAlgorithms) as PathAlgorithm[]).map((id) => ({
        id,
        title: pathAlgorithms[id].title,
        short: pathAlgorithms[id].short,
      })),
    },
  ],
  current: (s) => s.pathAlgorithm,
  pick: (id) => useStore.getState().setPathAlgorithm(id as PathAlgorithm),
  racers: (s) => s.pathRaceAlgorithms,
  toggleRacer: (id) => useStore.getState().togglePathRacer(id as PathAlgorithm),

  about: (s) => pathAlgorithms[s.pathAlgorithm],
  summary: (s) => pathTraits(s.pathAlgorithm),
  race: {
    tagline: "Same grid, same clock",
    description: PATH_RACE_DESCRIPTION,
    unit: { one: "cell", short: "cells" },
  },

  code: {
    lines: (s) => pathPseudocode[s.pathAlgorithm],
    line: (s) => selectPathFrame(s).line,
    narrate: (s, index) => narratePath(s.pathTimeline, Math.min(index, s.pathTimeline.length - 1), s.pathAlgorithm),
  },

  tour: pathfindingTour,
};
