import { GraphStage } from "./GraphStage";
import { GraphRaceLanes } from "./GraphRaceLanes";
import { GraphFacts, GraphLegend, GraphStatsInline, GraphTools } from "./GraphTools";
import { GraphSettings } from "./Settings";
import { graphAlgorithms, raceDescription } from "./algorithms";
import { graphPresetLabel, graphSizeLabels } from "./labels";
import { graphPseudocode } from "./searches";
import type { GraphAlgorithm } from "./types";
import { localized } from "@/i18n";
import { useStore } from "@/store";
import { narrateGraph } from "./narrate";
import { graphsTour } from "./tour";
import type { ModuleUI } from "@/modules/types";

const text = localized({
  en: {
    title: "Graphs",
    summary: (size: string, layout: string) => `${size}, ${layout}`,
    newRun: "New layout",
    tagline: "Same graph, same clock",
    unit: { one: "step", short: "steps" },
    usesWeights: "uses weights",
    ignoresWeights: "ignores weights",
  },
  es: {
    title: "Grafos",
    summary: (size, layout) => `${size}, ${layout}`,
    newRun: "Nueva disposición",
    tagline: "Mismo grafo, mismo reloj",
    unit: { one: "paso", short: "pasos" },
    usesWeights: "usa pesos",
    ignoresWeights: "ignora los pesos",
  },
});

export const graphsUI: ModuleUI = {
  id: "graphs",
  title: text.title,

  Stage: GraphStage,
  // Reshaping the graph is half the point, so the layouts sit right above it.
  Tools: GraphTools,
  Legend: GraphLegend,
  Stats: GraphStatsInline,
  Settings: GraphSettings,
  Facts: GraphFacts,

  settingsSummary: (s) => {
    const size = graphSizeLabels[s.graphs.size].split(" ")[0];
    const layout = graphPresetLabel(s.graphs.preset);
    return { main: size, detail: layout, label: text.summary(graphSizeLabels[s.graphs.size], layout) };
  },
  newRunLabel: text.newRun,

  algorithms: [
    {
      items: (Object.keys(graphAlgorithms) as GraphAlgorithm[]).map((id) => ({
        id,
        title: graphAlgorithms[id].title,
        short: graphAlgorithms[id].short,
      })),
    },
  ],
  current: (s) => s.graphs.algorithm,
  pick: (id) => useStore.getState().pick("graphs", id as GraphAlgorithm),

  race: {
    Stage: GraphRaceLanes,
    racers: (s) => s.graphs.racers,
    toggleRacer: (id) => useStore.getState().actions.graphs.toggleRacer(id as GraphAlgorithm),
    tagline: text.tagline,
    description: raceDescription,
    unit: text.unit,
  },

  about: (s) => graphAlgorithms[s.graphs.algorithm],
  summary: (s) => {
    const { structure, weighted } = graphAlgorithms[s.graphs.algorithm];
    return `${structure} · ${weighted ? text.usesWeights : text.ignoresWeights}`;
  },

  code: {
    lines: (s) => graphPseudocode[s.graphs.algorithm],
    line: (s) => s.graphs.run.frameAt(s.frameIndex).line,
    narrate: (s, index) => narrateGraph(s.graphs.run, Math.min(index, s.graphs.run.length - 1), s.graphs.algorithm),
  },

  tour: graphsTour,
};
