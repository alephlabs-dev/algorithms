import { pseudocode } from "./generators";
import { AlgorithmVisualizer } from "./AlgorithmVisualizer";
import { Complexity } from "./Complexity";
import { RaceLanes } from "./RaceLanes";
import { Legend, StatsInline } from "./RunInfo";
import { SortingSettings } from "@/components/Settings/SettingsPanel";
import { algorithmGroups } from "./algorithmGroups";
import { inputOrders } from "./inputOrders";
import { RACE_DESCRIPTION } from "@/consts/race";
import { sortingAlgorithms } from "./algorithms";
import { localized } from "@/i18n";
import { selectFrame, useStore } from "@/store";
import type { Algorithm } from "./types";
import { narrate } from "./narrate";
import { sortingTour } from "@/modules/tours";
import type { ModuleUI } from "@/modules/types";

const text = localized({
  en: {
    title: "Sorting",
    bars: "bars",
    numbers: "numbers",
    items: (n: number) => `${n} items`,
    newRun: "New array",
    always: (o: string) => `${o} always`,
    avgWorst: (avg: string, worst: string) => `${avg} avg · ${worst} worst`,
    tagline: "Same array, same clock",
    unit: { one: "operation", short: "ops" },
  },
  es: {
    title: "Ordenamiento",
    bars: "barras",
    numbers: "números",
    items: (n) => `${n} elementos`,
    newRun: "Nuevo arreglo",
    always: (o) => `${o} siempre`,
    // "prom. · peor" runs past the top bar at 1280px; the info popover has the full table.
    avgWorst: (avg, worst) => `${avg} · peor ${worst}`,
    tagline: "Mismo arreglo, mismo reloj",
    unit: { one: "operación", short: "ops" },
  },
});

/** Short enough for a field listing four racers on a phone. */
const shortName = (algorithm: Algorithm) =>
  sortingAlgorithms[algorithm].title.replace(/ Sort$/, "").replace("Cocktail Shaker", "Cocktail");

export const sortingUI: ModuleUI = {
  id: "sorting",
  title: text.title,

  Stage: AlgorithmVisualizer,
  Legend,
  Stats: StatsInline,
  Settings: SortingSettings,
  Facts: Complexity,

  settingsSummary: (s) => {
    const input = inputOrders[s.sorting.inputOrder].label;
    // Race lanes always draw bars, so the display mode only matters in single view.
    const display = s.view === "race" ? "" : `, ${s.sorting.displayMode === "bars" ? text.bars : text.numbers}`;
    return { main: String(s.sorting.size), detail: input, mono: true, label: `${text.items(s.sorting.size)}, ${input}${display}` };
  },
  newRunLabel: text.newRun,

  algorithms: algorithmGroups.map((group) => ({
    label: group.label,
    hint: group.hint,
    items: group.algorithms.map((id) => ({ id, title: sortingAlgorithms[id].title, short: shortName(id) })),
  })),
  current: (s) => s.sorting.algorithm,
  pick: (id) => useStore.getState().pick("sorting", id as Algorithm),

  about: (s) => sortingAlgorithms[s.sorting.algorithm],
  summary: (s) => {
    const { average, worst } = sortingAlgorithms[s.sorting.algorithm].timeComplexity;
    return average === worst ? text.always(average) : text.avgWorst(average, worst);
  },
  race: {
    Stage: RaceLanes,
    racers: (s) => s.sorting.racers,
    toggleRacer: (id) => useStore.getState().actions.sorting.toggleRacer(id as Algorithm),
    tagline: text.tagline,
    description: RACE_DESCRIPTION,
    unit: text.unit,
  },

  code: {
    lines: (s) => pseudocode[s.sorting.algorithm],
    line: (s) => selectFrame(s).line,
    narrate: (s, index) => narrate(s.sorting.run, Math.min(index, s.sorting.run.length - 1), pseudocode[s.sorting.algorithm]),
  },

  tour: sortingTour,
};
