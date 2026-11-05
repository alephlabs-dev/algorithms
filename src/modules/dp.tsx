import { DpRaceLanes } from "@/components/Race/DpRaceLanes";
import { DpStage } from "@/components/Dp/DpStage";
import { DpFacts, DpLegend, DpStatsInline, DpTools } from "@/components/Dp/DpTools";
import { DpSettings } from "@/components/Settings/SettingsPanel";
import { dpProblems } from "@/consts/dp";
import { DP_RACE_DESCRIPTION } from "@/consts/race";
import { dpPseudocode, encodeItems, EXAMPLE_CAPACITY, EXAMPLE_ITEMS, methods, wordPairs, type DpAlgorithm } from "@/dp";
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
    if (s.dpAlgorithm === "knapsack" || s.view === "race") {
      const example = s.dpCapacity === EXAMPLE_CAPACITY && encodeItems(s.dpItems) === encodeItems(EXAMPLE_ITEMS);
      return {
        main: `${s.dpItems.length}`,
        detail: example ? "Example" : `bag ${s.dpCapacity}`,
        mono: true,
        label: `${s.dpItems.length} items, a bag of ${s.dpCapacity}`,
      };
    }
    const label = `${s.dpA} · ${s.dpB}`;
    const example = wordPairs.some((p) => p.a === s.dpA && p.b === s.dpB);
    return { main: `${s.dpA.length}×${s.dpB.length}`, detail: example ? "Example" : "Your words", mono: true, label };
  },
  newRunLabel: "Next example",

  algorithms: [
    {
      label: "Two words",
      hint: "a table of prefixes",
      items: (["edit", "lcs"] as DpAlgorithm[]).map((id) => ({
        id,
        title: dpProblems[id].title,
        short: dpProblems[id].short,
      })),
    },
    {
      label: "Choosing items",
      hint: "a table of smaller bags",
      items: [{ id: "knapsack", title: dpProblems.knapsack.title, short: dpProblems.knapsack.short }],
    },
  ],
  current: (s) => s.dpAlgorithm,
  pick: (id) => useStore.getState().setDpAlgorithm(id as DpAlgorithm),

  race: {
    Stage: DpRaceLanes,
    // Always the same three: the race is about what writing answers down saves.
    racers: () => methods,
    toggleRacer: () => {},
    tagline: "One knapsack, three ways to solve it",
    description: DP_RACE_DESCRIPTION,
    unit: { one: "subproblem", short: "calls" },
  },

  about: (s) => dpProblems[s.dpAlgorithm],
  summary: (s) => dpProblems[s.dpAlgorithm].cost,

  code: {
    lines: (s) => dpPseudocode[s.dpAlgorithm],
    line: (s) => s.dpRun.frames[frameOf(s)].line,
    narrate: (s, index) => narrateDp(s.dpRun, Math.min(index, s.dpRun.length - 1)),
  },

  tour: dpTour,
};
