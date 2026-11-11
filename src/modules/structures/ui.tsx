import { StructureRaceLanes } from "./StructureRaceLanes";
import { StructureSettings } from "./Settings";
import { StructureStage } from "./StructureStage";
import {
  StructureFacts,
  StructureLegend,
  StructureStatsInline,
  StructureTools,
} from "./StructureTools";
import { raceDescription, structurePresetLabel, structures, structureSizeLabels } from "./algorithms";
import { structurePseudocode } from "./pseudocode";
import type { StructureAlgorithm } from "./types";
import { localized } from "@/i18n";
import { useStore } from "@/store";
import { narrateTree } from "./narrate";
import { structuresTour } from "./tour";
import type { ModuleUI } from "@/modules/types";

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

const frameOf = (s: { structures: { run: { frames: unknown[] } }; frameIndex: number }) =>
  Math.min(s.frameIndex, s.structures.run.frames.length - 1);

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
    const detail = structurePresetLabel(s.structures.preset);
    return {
      main: structureSizeLabels[s.structures.size],
      detail,
      mono: true,
      label: text.summary(structureSizeLabels[s.structures.size], detail),
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
  current: (s) => s.structures.algorithm,
  pick: (id) => useStore.getState().pick("structures", id as StructureAlgorithm),

  race: {
    Stage: StructureRaceLanes,
    // Always the same pair: the race is about what balancing buys.
    racers: () => ["bst", "avl"],
    toggleRacer: () => {},
    tagline: text.tagline,
    description: raceDescription,
    unit: text.unit,
  },

  about: (s) => structures[s.structures.algorithm],
  summary: (s) => structures[s.structures.algorithm].cost,

  code: {
    lines: (s) => structurePseudocode[s.structures.algorithm],
    line: (s) => s.structures.run.frames[frameOf(s)].line,
    narrate: (s, index) => narrateTree(s.structures.run, Math.min(index, s.structures.run.frames.length - 1)),
  },

  tour: structuresTour,
};
