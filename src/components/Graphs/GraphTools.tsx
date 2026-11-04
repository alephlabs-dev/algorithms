import { useShallow } from "zustand/react/shallow";
import { graphAlgorithms } from "@/consts/graphAlgorithms";
import { graphPresetOptions, graphSizeLabels } from "@/consts/graphLabels";
import type { GraphSize } from "@/graphs";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { FactLine } from "../ui/fact-line";
import { PresetButtons } from "../ui/preset-buttons";
import { SegmentedControl } from "../ui/segmented";

/** Ready-made layouts, one tap each. */
export const GraphPresetButtons = ({ className }: { className?: string }) => {
  const { apply, current } = useStore(useShallow((s) => ({ apply: s.applyGraphPreset, current: s.graphPreset })));
  return <PresetButtons presets={graphPresetOptions} current={current} onPick={apply} className={className} />;
};

/** Above the graph: the layouts, at hand since reshaping the graph is half the fun. */
export const GraphTools = ({ className }: { className?: string }) => (
  <div
    data-tour="tools"
    role="toolbar"
    aria-label="Graph tools"
    className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 self-start", className)}
  >
    <GraphPresetButtons />
  </div>
);

export const GraphSizePicker = () => {
  const { size, setSize } = useStore(useShallow((s) => ({ size: s.graphSize, setSize: s.setGraphSize })));
  return (
    <SegmentedControl<GraphSize>
      label="Graph size"
      options={(Object.keys(graphSizeLabels) as GraphSize[]).map((value) => ({
        value,
        label: graphSizeLabels[value].split(" ")[0],
      }))}
      value={size}
      onChange={(value) => value !== size && setSize(value)}
    />
  );
};

const Swatch = ({ className, label }: { className: string; label: string }) => (
  <li className="flex items-center gap-2">
    <span aria-hidden className={cn("h-2.5 w-2.5 shrink-0 rounded-full", className)} />
    {label}
  </li>
);

/** What each color on the graph means. The waiting color is named after the algorithm's structure. */
export const GraphLegend = ({ className, stacked }: { className?: string; stacked?: boolean }) => {
  const algorithm = useStore((s) => s.graphAlgorithm);
  const structure = graphAlgorithms[algorithm].structure.toLowerCase();
  return (
    <ul
      aria-label="Legend"
      className={cn(
        "flex text-xs text-foreground md:text-sm",
        stacked ? "flex-col gap-1.5" : "flex-wrap items-center gap-x-4 gap-y-1",
        className,
      )}
    >
      <Swatch className="bg-background ring-2 ring-primary" label="Start" />
      <Swatch className="bg-secondary" label={algorithm === "dfs" ? "On the stack" : `In the ${structure}`} />
      <Swatch className="bg-secondary/45" label="Visited" />
      <li className="flex items-center gap-2">
        <span aria-hidden className="h-1 w-4 shrink-0 rounded-full bg-primary" />
        Tree edge
      </li>
    </ul>
  );
};

/** Counters on one line, for the dock. */
export const GraphStatsInline = ({ className }: { className?: string }) => {
  const { stats, total } = useStore(
    useShallow((s) => ({ stats: s.graphTimeline.frameAt(s.frameIndex).stats, total: s.graph.nodes.length })),
  );
  return (
    <p className={cn("whitespace-nowrap font-mono text-xs text-foreground/80", className)}>
      {stats.visited}/{count(total, "node")} · {count(stats.examined, "edge")}
    </p>
  );
};

/** What the algorithm on stage keeps its nodes in, and how fast it is. */
export const GraphFacts = () => {
  const algorithm = useStore((s) => s.graphAlgorithm);
  const { structure, timeComplexity, weighted } = graphAlgorithms[algorithm];
  return <FactLine facts={[structure, weighted ? "uses weights" : "ignores weights", timeComplexity]} />;
};
