import { GraphStage } from "@/components/Graphs/GraphStage";
import { GraphFacts, GraphLegend, GraphStatsInline, GraphTools } from "@/components/Graphs/GraphTools";
import { GraphSettings } from "@/components/Settings/SettingsPanel";
import { graphAlgorithms } from "@/consts/graphAlgorithms";
import { graphPresetLabel, graphSizeLabels } from "@/consts/graphLabels";
import { graphPseudocode, type GraphAlgorithm } from "@/graphs";
import { useStore } from "@/store";
import { narrateGraph } from "@/utils/narrateGraph";
import { graphsTour } from "./tours";
import type { ModuleUI } from "./types";

export const graphsUI: ModuleUI = {
  id: "graphs",
  title: "Graphs",

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
    return { main: size, detail: layout, label: `${graphSizeLabels[s.graphSize]}, ${layout}` };
  },
  newRunLabel: "New layout",

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

  about: (s) => graphAlgorithms[s.graphAlgorithm],
  summary: (s) => {
    const { structure, weighted } = graphAlgorithms[s.graphAlgorithm];
    return `${structure} · ${weighted ? "uses weights" : "ignores weights"}`;
  },

  code: {
    lines: (s) => graphPseudocode[s.graphAlgorithm],
    line: (s) => s.graphTimeline.frameAt(s.frameIndex).line,
    narrate: (s, index) => narrateGraph(s.graphTimeline, Math.min(index, s.graphTimeline.length - 1), s.graphAlgorithm),
  },

  tour: graphsTour,
};
