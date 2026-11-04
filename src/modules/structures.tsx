import { StructureRaceLanes } from "@/components/Race/StructureRaceLanes";
import { StructureSettings } from "@/components/Settings/SettingsPanel";
import { StructureStage } from "@/components/Structures/StructureStage";
import {
  StructureFacts,
  StructureLegend,
  StructureStatsInline,
  StructureTools,
} from "@/components/Structures/StructureTools";
import { STRUCTURE_RACE_DESCRIPTION } from "@/consts/race";
import { structurePresetLabel, structures, structureSizeLabels } from "@/consts/structures";
import { structurePseudocode, type StructureAlgorithm } from "@/structures";
import { useStore } from "@/store";
import { narrateTree } from "@/utils/narrateTree";
import { structuresTour } from "./tours";
import type { ModuleUI } from "./types";

const frameOf = (s: { structureRun: { frames: unknown[] }; frameIndex: number }) =>
  Math.min(s.frameIndex, s.structureRun.frames.length - 1);

export const structuresUI: ModuleUI = {
  id: "structures",
  title: "Data structures",

  Stage: StructureStage,
  Tools: StructureTools,
  Legend: StructureLegend,
  Stats: StructureStatsInline,
  Settings: StructureSettings,
  Facts: StructureFacts,

  settingsSummary: (s) => {
    const detail = structurePresetLabel(s.structurePreset);
    return {
      main: structureSizeLabels[s.structureSize],
      detail,
      mono: true,
      label: `${structureSizeLabels[s.structureSize]} values, ${detail}`,
    };
  },
  newRunLabel: "New values",

  algorithms: [
    {
      label: "Trees",
      hint: "search in O(height)",
      items: (Object.keys(structures) as StructureAlgorithm[]).map((id) => ({
        id,
        title: structures[id].title,
        short: structures[id].short,
      })),
    },
  ],
  current: (s) => s.structureAlgorithm,
  pick: (id) => useStore.getState().setStructureAlgorithm(id as StructureAlgorithm),

  race: {
    Stage: StructureRaceLanes,
    // Always the same pair: the race is about what balancing buys.
    racers: () => ["bst", "avl"],
    toggleRacer: () => {},
    tagline: "Same values, with and without balancing",
    description: STRUCTURE_RACE_DESCRIPTION,
    unit: { one: "step", short: "steps" },
  },

  about: (s) => structures[s.structureAlgorithm],
  summary: (s) => structures[s.structureAlgorithm].cost,

  code: {
    lines: (s) => structurePseudocode[s.structureAlgorithm],
    line: (s) => s.structureRun.frames[frameOf(s)].line,
    narrate: (s, index) => narrateTree(s.structureRun, Math.min(index, s.structureRun.frames.length - 1)),
  },

  tour: structuresTour,
};
