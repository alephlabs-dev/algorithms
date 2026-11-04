import { pseudocode } from "@/algorithms";
import { AlgorithmVisualizer } from "@/components/AlgorithmVisualizer";
import { Complexity } from "@/components/Complexity";
import { RaceLanes } from "@/components/Race/RaceLanes";
import { Legend, StatsInline } from "@/components/RunInfo";
import { SortingSettings } from "@/components/Settings/SettingsPanel";
import { algorithmGroups } from "@/consts/algorithmGroups";
import { inputOrders } from "@/consts/inputOrders";
import { RACE_DESCRIPTION } from "@/consts/race";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { selectFrame, useStore } from "@/store";
import type { Algorithm } from "@/types";
import { narrate } from "@/utils/narrate";
import { sortingTour } from "./tours";
import type { ModuleUI } from "./types";

/** Short enough for a field listing four racers on a phone. */
const shortName = (algorithm: Algorithm) =>
  sortingAlgorithms[algorithm].title.replace(/ Sort$/, "").replace("Cocktail Shaker", "Cocktail");

export const sortingUI: ModuleUI = {
  id: "sorting",
  title: "Sorting",

  Stage: AlgorithmVisualizer,
  Legend,
  Stats: StatsInline,
  Settings: SortingSettings,
  Facts: Complexity,

  settingsSummary: (s) => {
    const input = inputOrders[s.inputOrder].label;
    // Race lanes always draw bars, so the display mode only matters in single view.
    const display = s.view === "race" ? "" : `, ${s.displayMode === "bars" ? "bars" : "numbers"}`;
    return { main: String(s.size), detail: input, mono: true, label: `${s.size} items, ${input}${display}` };
  },
  newRunLabel: "New array",

  algorithms: algorithmGroups.map((group) => ({
    label: group.label,
    hint: group.hint,
    items: group.algorithms.map((id) => ({ id, title: sortingAlgorithms[id].title, short: shortName(id) })),
  })),
  current: (s) => s.activeAlgorithm,
  pick: (id) => useStore.getState().setActiveAlgorithm(id as Algorithm),

  about: (s) => sortingAlgorithms[s.activeAlgorithm],
  summary: (s) => {
    const { average, worst } = sortingAlgorithms[s.activeAlgorithm].timeComplexity;
    return average === worst ? `${average} always` : `${average} avg · ${worst} worst`;
  },
  race: {
    Stage: RaceLanes,
    racers: (s) => s.raceAlgorithms,
    toggleRacer: (id) => useStore.getState().toggleRaceAlgorithm(id as Algorithm),
    tagline: "Same array, same clock",
    description: RACE_DESCRIPTION,
    unit: { one: "operation", short: "ops" },
  },

  code: {
    lines: (s) => pseudocode[s.activeAlgorithm],
    line: (s) => selectFrame(s).line,
    narrate: (s, index) => narrate(s.timeline, Math.min(index, s.timeline.length - 1), pseudocode[s.activeAlgorithm]),
  },

  tour: sortingTour,
};
