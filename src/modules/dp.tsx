import { DpStage } from "@/components/Dp/DpStage";
import { DpFacts, DpLegend, DpStatsInline, DpTools } from "@/components/Dp/DpTools";
import { DpSettings } from "@/components/Settings/SettingsPanel";
import { dpProblems } from "@/consts/dp";
import { dpPseudocode, wordPairs, type DpAlgorithm } from "@/dp";
import { useStore } from "@/store";
import { narrateDp } from "@/utils/narrateDp";
import { dpTour } from "./tours";
import type { ModuleUI } from "./types";

const frameOf = (s: { dpRun: { length: number }; frameIndex: number }) => Math.min(s.frameIndex, s.dpRun.length - 1);

export const dpUI: ModuleUI = {
  id: "dp",
  title: "Dynamic programming",

  Stage: DpStage,
  Tools: DpTools,
  Legend: DpLegend,
  Stats: DpStatsInline,
  Settings: DpSettings,
  Facts: DpFacts,

  settingsSummary: (s) => {
    const label = `${s.dpA} · ${s.dpB}`;
    const example = wordPairs.some((p) => p.a === s.dpA && p.b === s.dpB);
    return { main: `${s.dpA.length}×${s.dpB.length}`, detail: example ? "Example" : "Your words", mono: true, label };
  },
  newRunLabel: "Next example",

  algorithms: [
    {
      label: "Two words",
      hint: "a table of prefixes",
      items: (Object.keys(dpProblems) as DpAlgorithm[]).map((id) => ({
        id,
        title: dpProblems[id].title,
        short: dpProblems[id].short,
      })),
    },
  ],
  current: (s) => s.dpAlgorithm,
  pick: (id) => useStore.getState().setDpAlgorithm(id as DpAlgorithm),

  about: (s) => dpProblems[s.dpAlgorithm],
  summary: (s) => dpProblems[s.dpAlgorithm].cost,

  code: {
    lines: (s) => dpPseudocode[s.dpAlgorithm],
    line: (s) => s.dpRun.frames[frameOf(s)].line,
    narrate: (s, index) => narrateDp(s.dpRun, Math.min(index, s.dpRun.length - 1)),
  },

  tour: dpTour,
};
