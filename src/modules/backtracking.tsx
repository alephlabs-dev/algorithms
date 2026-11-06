import { BacktrackingStage } from "@/components/Backtracking/BacktrackingStage";
import {
  BacktrackingFacts,
  BacktrackingLegend,
  BacktrackingStatsInline,
  BacktrackingTools,
} from "@/components/Backtracking/BacktrackingTools";
import { BacktrackingSettings } from "@/components/Settings/SettingsPanel";
import { queensPseudocode, runOf, sudokuPseudocode, type BacktrackingProblem } from "@/backtracking";
import { backtrackingProblems, sudokuPuzzleNames } from "@/consts/backtracking";
import { localized } from "@/i18n";
import { useStore, type StoreState } from "@/store";
import { count } from "@/utils/count";
import { narrateBacktracking, narrateSudoku } from "@/utils/narrateBacktracking";
import { backtrackingTour } from "./tours";
import type { ModuleUI } from "./types";

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
    pseudocode: string[];
    narrate: (s: StoreState, index: number) => string;
  }
> = {
  queens: {
    settingsSummary: (s) => ({ main: String(s.queensN), detail: text.queensWord, mono: true, label: text.queens(s.queensN) }),
    summary: (s) => text.summary(s.queensN),
    pseudocode: queensPseudocode,
    narrate: (s, index) => narrateBacktracking(s.queensRun, index),
  },
  sudoku: {
    settingsSummary: (s) => {
      const name = sudokuPuzzleNames[s.sudokuPuzzle];
      return { main: name, detail: text.puzzleWord, label: text.puzzleLabel(name) };
    },
    summary: (s) => text.sudokuSummary(sudokuPuzzleNames[s.sudokuPuzzle]),
    pseudocode: sudokuPseudocode,
    narrate: (s, index) => narrateSudoku(s.sudokuRun, index),
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

  settingsSummary: (s) => problems[s.backtrackingProblem].settingsSummary(s),
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
  current: (s) => s.backtrackingProblem,
  pick: (id) => useStore.getState().setBacktrackingProblem(id as BacktrackingProblem),

  about: (s) => backtrackingProblems[s.backtrackingProblem],
  summary: (s) => problems[s.backtrackingProblem].summary(s),

  code: {
    lines: (s) => problems[s.backtrackingProblem].pseudocode,
    line: (s) => runOf(s).frameAt(s.frameIndex).line,
    narrate: (s, index) => problems[s.backtrackingProblem].narrate(s, index),
  },

  tour: backtrackingTour,
};
