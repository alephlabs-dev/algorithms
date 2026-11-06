import { BacktrackingStage } from "@/components/Backtracking/BacktrackingStage";
import {
  BacktrackingFacts,
  BacktrackingLegend,
  BacktrackingStatsInline,
  BacktrackingTools,
} from "@/components/Backtracking/BacktrackingTools";
import { BacktrackingSettings } from "@/components/Settings/SettingsPanel";
import { queensPseudocode, runOf, sudokuPseudocode, type BacktrackingProblem, type SudokuPuzzle } from "@/backtracking";
import { backtrackingProblems } from "@/consts/backtracking";
import { localized } from "@/i18n";
import { useStore } from "@/store";
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
    puzzles: { easy: "Easy", hard: "Hard" } as Record<SudokuPuzzle, string>,
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
    puzzles: { easy: "Fácil", hard: "Difícil" },
    puzzleLabel: (name) => `Sudoku ${name.toLowerCase()}`,
    sudokuSummary: (name) => `${name} · 9×9 · O(9ᵐ) en el peor caso`,
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

  settingsSummary: (s) =>
    s.backtrackingProblem === "sudoku"
      ? {
          main: text.puzzles[s.sudokuPuzzle],
          detail: text.puzzleWord,
          label: text.puzzleLabel(text.puzzles[s.sudokuPuzzle]),
        }
      : { main: String(s.queensN), detail: text.queensWord, mono: true, label: text.queens(s.queensN) },
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
  summary: (s) =>
    s.backtrackingProblem === "sudoku" ? text.sudokuSummary(text.puzzles[s.sudokuPuzzle]) : text.summary(s.queensN),

  code: {
    lines: (s) => (s.backtrackingProblem === "sudoku" ? sudokuPseudocode : queensPseudocode),
    line: (s) => runOf(s).frameAt(s.frameIndex).line,
    narrate: (s, index) =>
      s.backtrackingProblem === "sudoku" ? narrateSudoku(s.sudokuRun, index) : narrateBacktracking(s.queensRun, index),
  },

  tour: backtrackingTour,
};
