import { DpRaceLanes } from "@/components/Race/DpRaceLanes";
import { DpStage } from "@/components/Dp/DpStage";
import { DpFacts, DpLegend, DpStatsInline, DpTools } from "@/components/Dp/DpTools";
import { DpSettings } from "@/components/Settings/SettingsPanel";
import { dpMethods, dpProblems } from "@/consts/dp";
import { DP_RACE_DESCRIPTION } from "@/consts/race";
import {
  dpPseudocode,
  encodeItems,
  EXAMPLE_CAPACITY,
  EXAMPLE_ITEMS,
  methods,
  wordPairs,
  type DpAlgorithm,
  type Method,
} from "@/dp";
import { localized } from "@/i18n";
import { useStore } from "@/store";
import { narrateDp } from "@/utils/narrateDp";
import { dpTour } from "./tours";
import type { ModuleUI } from "./types";

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

const frameOf = (s: { dpRun: { length: number }; frameIndex: number }) => Math.min(s.frameIndex, s.dpRun.length - 1);

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
    if (s.dpAlgorithm === "knapsack" || s.view === "race") {
      const example = s.dpCapacity === EXAMPLE_CAPACITY && encodeItems(s.dpItems) === encodeItems(EXAMPLE_ITEMS);
      return {
        main: `${s.dpItems.length}`,
        detail: example ? text.example : text.bag(s.dpCapacity),
        mono: true,
        label: text.itemsLabel(s.dpItems.length, s.dpCapacity),
      };
    }
    const label = `${s.dpA} · ${s.dpB}`;
    const example = wordPairs.some((p) => p.a === s.dpA && p.b === s.dpB);
    return { main: `${s.dpA.length}×${s.dpB.length}`, detail: example ? text.example : text.yourWords, mono: true, label };
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
  current: (s) => s.dpAlgorithm,
  pick: (id) => useStore.getState().setDpAlgorithm(id as DpAlgorithm),

  race: {
    Stage: DpRaceLanes,
    // Always the same three: the race is about what writing answers down saves.
    racers: () => methods,
    toggleRacer: () => {},
    tagline: text.tagline,
    description: DP_RACE_DESCRIPTION,
    unit: text.unit,
    racerName: (id) => dpMethods[id as Method].short,
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
