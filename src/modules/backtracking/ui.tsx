import { BacktrackingStage } from "./BacktrackingStage";
import {
  BacktrackingFacts,
  BacktrackingLegend,
  BacktrackingStatsInline,
  BacktrackingTools,
} from "./BacktrackingTools";
import { BacktrackingSettings } from "./Settings";
import { queensPseudocode, sudokuPseudocodeFor } from "./pseudocode";
import { runOf } from "./run";
import type { BacktrackingProblem } from "./types";
import { backtrackingProblems, fillOrderNames, sudokuPuzzleNames } from "./algorithms";
import { localized } from "@/i18n";
import { useStore, type StoreState } from "@/store";
import { count } from "@/utils/count";
import { narrateBacktracking, narrateSudoku } from "./narrate";
import { backtrackingTour } from "./tour";
import type { ModuleUI } from "@/modules/types";

const text = localized({
  en: {
    title: "Backtracking",
    queensWord: "queens",
    queens: (n: number) => count(n, "queen"),
    newRun: "Next board",
    summary: (n: number) => `${n}×${n} board · O(N!) worst case`,
    puzzleWord: "puzzle",
    puzzleLabel: (name: string) => `${name} puzzle`,
    sudokuSummary: (name: string) => `${name} · 9×9 · O(9ᵐ) worst case`,
  },
  es: {
    title: "Backtracking",
    queensWord: "reinas",
    queens: (n) => count(n, "reina"),
    newRun: "Siguiente tablero",
    summary: (n) => `Tablero de ${n}×${n} · O(N!) en el peor caso`,
    puzzleWord: "sudoku",
    puzzleLabel: (name) => `Sudoku ${name.toLowerCase()}`,
    sudokuSummary: (name) => `${name} · 9×9 · O(9ᵐ) en el peor caso`,
  },
});

/** What differs between the problems, in one place: their settings, pseudocode and words. */
const problems: Record<
  BacktrackingProblem,
  {
    settingsSummary: ModuleUI["settingsSummary"];
    summary: (s: StoreState) => string;
    pseudocode: (s: StoreState) => string[];
    narrate: (s: StoreState, index: number) => string;
  }
> = {
  queens: {
    settingsSummary: (s) => ({ main: String(s.backtracking.queensN), detail: text.queensWord, mono: true, label: text.queens(s.backtracking.queensN) }),
    summary: (s) => text.summary(s.backtracking.queensN),
    pseudocode: () => queensPseudocode,
    narrate: (s, index) => narrateBacktracking(s.backtracking.queensRun, index),
  },
  sudoku: {
    settingsSummary: (s) => {
      const name = sudokuPuzzleNames[s.backtracking.sudokuPuzzle];
      const detail = s.backtracking.sudokuOrder === "mrv" ? "MRV" : text.puzzleWord;
      return { main: name, detail, label: `${text.puzzleLabel(name)}, ${fillOrderNames[s.backtracking.sudokuOrder]}` };
    },
    summary: (s) =>
      text.sudokuSummary(sudokuPuzzleNames[s.backtracking.sudokuPuzzle]) + (s.backtracking.sudokuOrder === "mrv" ? " · MRV" : ""),
    pseudocode: (s) => sudokuPseudocodeFor(s.backtracking.sudokuOrder),
    narrate: (s, index) => narrateSudoku(s.backtracking.sudokuRun, index),
  },
};

export const backtrackingUI: ModuleUI = {
  id: "backtracking",
  title: text.title,

  Stage: BacktrackingStage,
  Tools: BacktrackingTools,
  Legend: BacktrackingLegend,
  Stats: BacktrackingStatsInline,
  Settings: BacktrackingSettings,
  Facts: BacktrackingFacts,

  settingsSummary: (s) => problems[s.backtracking.problem].settingsSummary(s),
  // The next board size, or the other puzzle.
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
  current: (s) => s.backtracking.problem,
  pick: (id) => useStore.getState().pick("backtracking", id as BacktrackingProblem),

  about: (s) => backtrackingProblems[s.backtracking.problem],
  summary: (s) => problems[s.backtracking.problem].summary(s),

  code: {
    lines: (s) => problems[s.backtracking.problem].pseudocode(s),
    line: (s) => runOf(s.backtracking).frameAt(s.frameIndex).line,
    narrate: (s, index) => problems[s.backtracking.problem].narrate(s, index),
  },

  tour: backtrackingTour,
};
