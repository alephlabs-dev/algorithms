import { DpRaceLanes } from "./DpRaceLanes";
import { DpStage } from "./DpStage";
import { DpFacts, DpLegend, DpStatsInline, DpTools } from "./DpTools";
import { DpSettings } from "./Settings";
import { dpMethods, dpProblems, raceDescription } from "./algorithms";
import { dpPseudocode } from "./pseudocode";
import { encodeItems, EXAMPLE_CAPACITY, EXAMPLE_ITEMS, wordPairs } from "./presets";
import { methods } from "./work";
import type { Method } from "./types";
import type { DpAlgorithm } from "./types";
import { localized } from "@/i18n";
import { useStore } from "@/store";
import { narrateDp } from "./narrate";
import { dpTour } from "./tour";
import type { ModuleUI } from "@/modules/types";

const text = localized({
  en: {
    title: "Dynamic programming",
    example: "Example",
    bag: (n: number) => `bag ${n}`,
    itemsLabel: (items: number, capacity: number) => `${items} items, a bag of ${capacity}`,
    yourWords: "Your words",
    newRun: "Next example",
    twoWords: "Two words",
    prefixes: "a table of prefixes",
    choosing: "Choosing items",
    smallerBags: "a table of smaller bags",
    tagline: "One knapsack, three ways to solve it",
    unit: { one: "subproblem", short: "calls" },
  },
  es: {
    title: "Programación dinámica",
    example: "Ejemplo",
    bag: (n) => `mochila ${n}`,
    itemsLabel: (items, capacity) => `${items} ${items === 1 ? "objeto" : "objetos"}, una mochila de ${capacity}`,
    yourWords: "Tus palabras",
    newRun: "Siguiente ejemplo",
    twoWords: "Dos palabras",
    prefixes: "una tabla de prefijos",
    choosing: "Elegir objetos",
    smallerBags: "una tabla de mochilas más pequeñas",
    tagline: "Una mochila, tres formas de resolverla",
    unit: { one: "subproblema", short: "llamadas" },
  },
});

const frameOf = (s: { dp: { run: { length: number } }; frameIndex: number }) => Math.min(s.frameIndex, s.dp.run.length - 1);

export const dpUI: ModuleUI = {
  id: "dp",
  title: text.title,

  Stage: DpStage,
  Tools: DpTools,
  Legend: DpLegend,
  Stats: DpStatsInline,
  Settings: DpSettings,
  Facts: DpFacts,

  settingsSummary: (s) => {
    if (s.dp.algorithm === "knapsack" || s.view === "race") {
      const example = s.dp.capacity === EXAMPLE_CAPACITY && encodeItems(s.dp.items) === encodeItems(EXAMPLE_ITEMS);
      return {
        main: `${s.dp.items.length}`,
        detail: example ? text.example : text.bag(s.dp.capacity),
        mono: true,
        label: text.itemsLabel(s.dp.items.length, s.dp.capacity),
      };
    }
    const label = `${s.dp.a} · ${s.dp.b}`;
    const example = wordPairs.some((p) => p.a === s.dp.a && p.b === s.dp.b);
    return { main: `${s.dp.a.length}×${s.dp.b.length}`, detail: example ? text.example : text.yourWords, mono: true, label };
  },
  newRunLabel: text.newRun,

  algorithms: [
    {
      label: text.twoWords,
      hint: text.prefixes,
      items: (["edit", "lcs"] as DpAlgorithm[]).map((id) => ({
        id,
        title: dpProblems[id].title,
        short: dpProblems[id].short,
      })),
    },
    {
      label: text.choosing,
      hint: text.smallerBags,
      items: [{ id: "knapsack", title: dpProblems.knapsack.title, short: dpProblems.knapsack.short }],
    },
  ],
  current: (s) => s.dp.algorithm,
  pick: (id) => useStore.getState().pick("dp", id as DpAlgorithm),

  race: {
    Stage: DpRaceLanes,
    // Always the same three: the race is about what writing answers down saves.
    racers: () => methods,
    toggleRacer: () => {},
    tagline: text.tagline,
    description: raceDescription,
    unit: text.unit,
    racerName: (id) => dpMethods[id as Method].short,
  },

  about: (s) => dpProblems[s.dp.algorithm],
  summary: (s) => dpProblems[s.dp.algorithm].cost,

  code: {
    lines: (s) => dpPseudocode[s.dp.algorithm],
    line: (s) => s.dp.run.frames[frameOf(s)].line,
    narrate: (s, index) => narrateDp(s.dp.run, Math.min(index, s.dp.run.length - 1)),
  },

  tour: dpTour,
};
