import { MazeStage } from "@/components/Mazes/MazeStage";
import { MazeFacts, MazeLegend, MazeStatsInline } from "@/components/Mazes/MazeTools";
import { MazeRaceLanes } from "@/components/Race/MazeRaceLanes";
import { MazeSettings } from "@/components/Settings/SettingsPanel";
import { mazeAlgorithms, mazeSizeLabels } from "@/consts/mazeAlgorithms";
import { MAZE_RACE_DESCRIPTION } from "@/consts/race";
import { localized } from "@/i18n";
import { MAZE_ALGORITHMS, mazePseudocode, type MazeAlgorithm } from "@/mazes";
import { useStore } from "@/store";
import { narrateMaze } from "@/utils/narrateMaze";
import { mazesTour } from "./tours";
import type { ModuleUI } from "./types";

const text = localized({
  en: {
    title: "Mazes",
    maze: "maze",
    size: (size: string) => `${size} maze`,
    newRun: "New maze",
    tagline: "Same seed, same clock",
    unit: { one: "step", short: "steps" },
  },
  es: {
    title: "Laberintos",
    maze: "laberinto",
    size: (size) => `Laberinto ${size.toLowerCase()}`,
    newRun: "Laberinto nuevo",
    tagline: "Misma semilla, mismo reloj",
    unit: { one: "paso", short: "pasos" },
  },
});

export const mazesUI: ModuleUI = {
  id: "mazes",
  title: text.title,

  Stage: MazeStage,
  Legend: MazeLegend,
  Stats: MazeStatsInline,
  Settings: MazeSettings,
  Facts: MazeFacts,

  settingsSummary: (s) => {
    const size = mazeSizeLabels[s.mazes.size];
    return { main: size, detail: text.maze, label: text.size(size) };
  },
  newRunLabel: text.newRun,

  algorithms: [
    {
      items: MAZE_ALGORITHMS.map((id) => ({ id, title: mazeAlgorithms[id].title, short: mazeAlgorithms[id].short })),
    },
  ],
  current: (s) => s.mazes.algorithm,
  pick: (id) => useStore.getState().pick("mazes", id as MazeAlgorithm),

  about: (s) => mazeAlgorithms[s.mazes.algorithm],
  summary: (s) => `${mazeAlgorithms[s.mazes.algorithm].texture} · ${mazeAlgorithms[s.mazes.algorithm].timeComplexity}`,
  race: {
    Stage: MazeRaceLanes,
    racers: (s) => s.mazes.racers,
    toggleRacer: (id) => useStore.getState().actions.mazes.toggleRacer(id as MazeAlgorithm),
    tagline: text.tagline,
    description: MAZE_RACE_DESCRIPTION,
    unit: text.unit,
  },

  code: {
    lines: (s) => mazePseudocode[s.mazes.algorithm],
    line: (s) => s.mazes.run.frameAt(s.frameIndex).line,
    narrate: (s, index) => narrateMaze(s.mazes.run, Math.min(index, s.mazes.run.length - 1)),
  },

  tour: mazesTour,
};
