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
import { localized } from "@/i18n";
import { useStore } from "@/store";
import { narrateTree } from "@/utils/narrateTree";
import { structuresTour } from "./tours";
import type { ModuleUI } from "./types";

const text = localized({
  en: {
    title: "Data structures",
    summary: (n: string, detail: string) => `${n} values, ${detail}`,
    newRun: "New values",
    groups: { Trees: "Trees", Heaps: "Heaps", "Hash tables": "Hash tables" },
    hints: { "O(height)": "O(height)", "min on top": "min on top", "O(1) average": "O(1) average" },
    tagline: "Same values, with and without balancing",
    unit: { one: "step", short: "steps" },
  },
  es: {
    title: "Estructuras de datos",
    summary: (n, detail) => `${n} valores, ${detail}`,
    newRun: "Nuevos valores",
    groups: { Trees: "Árboles", Heaps: "Montículos", "Hash tables": "Tablas hash" },
    hints: { "O(height)": "O(altura)", "min on top": "mínimo arriba", "O(1) average": "O(1) en promedio" },
    tagline: "Mismos valores, con y sin balanceo",
    unit: { one: "paso", short: "pasos" },
  },
});

const frameOf = (s: { structureRun: { frames: unknown[] }; frameIndex: number }) =>
  Math.min(s.frameIndex, s.structureRun.frames.length - 1);

export const structuresUI: ModuleUI = {
  id: "structures",
  title: text.title,

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
      label: text.summary(structureSizeLabels[s.structureSize], detail),
    };
  },
  newRunLabel: text.newRun,

  // "Hash chaining", "Encadenamiento" don't fit a fifth of a phone's row.
  namesTooLongForSegments: true,
  algorithms: (
    [
      ["Trees", "O(height)"],
      ["Heaps", "min on top"],
      ["Hash tables", "O(1) average"],
    ] as const
  ).map(([group, hint]) => ({
    label: text.groups[group],
    hint: text.hints[hint],
    items: (Object.keys(structures) as StructureAlgorithm[])
      .filter((id) => structures[id].group === group)
      .map((id) => ({ id, title: structures[id].title, short: structures[id].short })),
  })),
  current: (s) => s.structureAlgorithm,
  pick: (id) => useStore.getState().setStructureAlgorithm(id as StructureAlgorithm),

  race: {
    Stage: StructureRaceLanes,
    // Always the same pair: the race is about what balancing buys.
    racers: () => ["bst", "avl"],
    toggleRacer: () => {},
    tagline: text.tagline,
    description: STRUCTURE_RACE_DESCRIPTION,
    unit: text.unit,
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
