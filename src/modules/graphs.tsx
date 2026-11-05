import { GraphStage } from "@/components/Graphs/GraphStage";
import { GraphRaceLanes } from "@/components/Race/GraphRaceLanes";
import { GraphFacts, GraphLegend, GraphStatsInline, GraphTools } from "@/components/Graphs/GraphTools";
import { GraphSettings } from "@/components/Settings/SettingsPanel";
import { graphAlgorithms } from "@/consts/graphAlgorithms";
import { graphPresetLabel, graphSizeLabels } from "@/consts/graphLabels";
import { GRAPH_RACE_DESCRIPTION } from "@/consts/race";
import { graphPseudocode, type GraphAlgorithm } from "@/graphs";
import { localized } from "@/i18n";
import { useStore } from "@/store";
import { narrateGraph } from "@/utils/narrateGraph";
import { graphsTour } from "./tours";
import type { ModuleUI } from "./types";

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
    const size = graphSizeLabels[s.graphSize].split(" ")[0];
    const layout = graphPresetLabel(s.graphPreset);
    return { main: size, detail: layout, label: text.summary(graphSizeLabels[s.graphSize], layout) };
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
  current: (s) => s.graphAlgorithm,
  pick: (id) => useStore.getState().setGraphAlgorithm(id as GraphAlgorithm),

  race: {
    Stage: GraphRaceLanes,
    racers: (s) => s.graphRaceAlgorithms,
    toggleRacer: (id) => useStore.getState().toggleGraphRacer(id as GraphAlgorithm),
    tagline: text.tagline,
    description: GRAPH_RACE_DESCRIPTION,
    unit: text.unit,
  },

  about: (s) => graphAlgorithms[s.graphAlgorithm],
  summary: (s) => {
    const { structure, weighted } = graphAlgorithms[s.graphAlgorithm];
    return `${structure} · ${weighted ? text.usesWeights : text.ignoresWeights}`;
  },

  code: {
    lines: (s) => graphPseudocode[s.graphAlgorithm],
    line: (s) => s.graphTimeline.frameAt(s.frameIndex).line,
    narrate: (s, index) => narrateGraph(s.graphTimeline, Math.min(index, s.graphTimeline.length - 1), s.graphAlgorithm),
  },

  tour: graphsTour,
};
