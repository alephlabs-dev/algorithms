import { BacktrackingStage } from "@/components/Backtracking/BacktrackingStage";
import {
  BacktrackingFacts,
  BacktrackingLegend,
  BacktrackingStatsInline,
  BacktrackingTools,
} from "@/components/Backtracking/BacktrackingTools";
import { BacktrackingSettings } from "@/components/Settings/SettingsPanel";
import { queensPseudocode, type BacktrackingProblem } from "@/backtracking";
import { backtrackingProblems } from "@/consts/backtracking";
import { localized } from "@/i18n";
import { useStore } from "@/store";
import { count } from "@/utils/count";
import { narrateBacktracking } from "@/utils/narrateBacktracking";
import { backtrackingTour } from "./tours";
import type { ModuleUI } from "./types";

const text = localized({
  en: {
    title: "Backtracking",
    queensWord: "queens",
    queens: (n: number) => count(n, "queen"),
    newRun: "Next board size",
    summary: (n: number) => `${n}×${n} board · O(N!) worst case`,
  },
  es: {
    title: "Backtracking",
    queensWord: "reinas",
    queens: (n) => count(n, "reina"),
    newRun: "Siguiente tamaño",
    summary: (n) => `Tablero de ${n}×${n} · O(N!) en el peor caso`,
  },
});

export const backtrackingUI: ModuleUI = {
  id: "backtracking",
  title: text.title,

  Stage: BacktrackingStage,
  Tools: BacktrackingTools,
  Legend: BacktrackingLegend,
  Stats: BacktrackingStatsInline,
  Settings: BacktrackingSettings,
  Facts: BacktrackingFacts,

  settingsSummary: (s) => ({
    main: String(s.queensN),
    detail: text.queensWord,
    mono: true,
    label: text.queens(s.queensN),
  }),
  newRunLabel: text.newRun,

  algorithms: [
    {
      items: (Object.keys(backtrackingProblems) as BacktrackingProblem[]).map((id) => ({
        id,
        title: backtrackingProblems[id].title,
        short: backtrackingProblems[id].short,
      })),
    },
  ],
  current: (s) => s.backtrackingProblem,
  pick: (id) => useStore.getState().setBacktrackingProblem(id as BacktrackingProblem),

  about: (s) => backtrackingProblems[s.backtrackingProblem],
  summary: (s) => text.summary(s.queensN),

  code: {
    lines: () => queensPseudocode,
    line: (s) => s.queensRun.frameAt(s.frameIndex).line,
    narrate: (s, index) => narrateBacktracking(s.queensRun, index),
  },

  tour: backtrackingTour,
};
