import { useShallow } from "zustand/react/shallow";
import { graphAlgorithms } from "./algorithms";
import { graphPresetOptions, graphSizeLabels } from "./labels";
import type { GraphSize } from "./graph";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { FactLine } from "@/components/ui/fact-line";
import { PresetButtons } from "@/components/ui/preset-buttons";
import { SegmentedControl } from "@/components/ui/segmented";
import { localized } from "@/i18n";

const text = localized({
  en: {
    tools: "Graph tools",
    size: "Graph size",
    waiting: "Waiting",
    done: "Done",
    inTree: "In the tree",
    skipped: "Skipped",
    keptEdge: "Kept edge",
    wouldLoop: "Skipped: would loop",
    ready: "Ready",
    placed: "Placed",
    crossedOut: "Crossed out",
    start: "Start",
    onStack: "On the stack",
    couldJoin: "Could join",
    inStructure: (structure: string) => `In the ${structure.toLowerCase()}`,
    visited: "Visited",
    treeEdge: "Tree edge",
    legend: "Legend",
    stats: (visited: number, total: number, examined: number) => `${visited}/${count(total, "node")} · ${count(examined, "edge")}`,
    usesWeights: "uses weights",
    ignoresWeights: "ignores weights",
  },
  es: {
    tools: "Herramientas del grafo",
    size: "Tamaño del grafo",
    waiting: "En espera",
    done: "Listo",
    inTree: "En el árbol",
    skipped: "Descartada",
    keptEdge: "Arista elegida",
    wouldLoop: "Descartada: cerraría un ciclo",
    ready: "Listo",
    placed: "Ubicado",
    crossedOut: "Tachada",
    start: "Inicio",
    onStack: "En la pila",
    couldJoin: "Podría unirse",
    inStructure: (structure) => `En la ${structure.toLowerCase()}`,
    visited: "Visitado",
    treeEdge: "Arista del árbol",
    legend: "Leyenda",
    stats: (visited, total, examined) => `${visited}/${count(total, "nodo")} · ${count(examined, "arista")}`,
    usesWeights: "usa pesos",
    ignoresWeights: "ignora los pesos",
  },
});


/** Ready-made layouts, one tap each. */
export const GraphPresetButtons = ({ className }: { className?: string }) => {
  const { apply, current } = useStore(useShallow((s) => ({ apply: s.actions.graphs.applyPreset, current: s.graphs.preset })));
  return <PresetButtons presets={graphPresetOptions} current={current} onPick={apply} className={className} />;
};

/** Above the graph: the layouts, at hand since reshaping the graph is half the fun. */
export const GraphTools = ({ className }: { className?: string }) => (
  <div
    data-tour="tools"
    role="toolbar"
    aria-label={text.tools}
    className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 self-start", className)}
  >
    <GraphPresetButtons />
  </div>
);

export const GraphSizePicker = () => {
  const { size, setSize } = useStore(useShallow((s) => ({ size: s.graphs.size, setSize: s.actions.graphs.setSize })));
  return (
    <SegmentedControl<GraphSize>
      label={text.size}
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

const Line = ({ className, label }: { className: string; label: string }) => (
  <li className="flex items-center gap-2">
    <span aria-hidden className={cn("h-1 w-4 shrink-0 rounded-full", className)} />
    {label}
  </li>
);

/** What each color on the graph means, in each algorithm's words. */
export const GraphLegend = ({ className }: { className?: string }) => {
  const { algorithm, isRace } = useStore(
    useShallow((s) => ({ algorithm: s.graphs.algorithm, isRace: s.view === "race" })),
  );
  const structure = graphAlgorithms[algorithm].structure;
  // Race lanes mix algorithms: words that fit them all.
  const items = isRace ? (
    <>
      <Swatch className="bg-secondary" label={text.waiting} />
      <Swatch className="bg-secondary/45" label={text.done} />
      <Line className="bg-primary" label={text.inTree} />
      <Line
        className="bg-[repeating-linear-gradient(90deg,var(--color-line)_0_4px,transparent_4px_7px)]"
        label={text.skipped}
      />
    </>
  ) : algorithm === "kruskal" ? (
    <>
      <Swatch className="bg-secondary/45" label={text.inTree} />
      <Line className="bg-primary" label={text.keptEdge} />
      <Line
        className="bg-[repeating-linear-gradient(90deg,var(--color-line)_0_4px,transparent_4px_7px)]"
        label={text.wouldLoop}
      />
    </>
  ) : algorithm === "topo" ? (
    <>
      <Swatch className="bg-secondary" label={text.ready} />
      <Swatch className="bg-secondary/45" label={text.placed} />
      <Line className="bg-primary" label={text.crossedOut} />
    </>
  ) : (
    <>
      <Swatch className="bg-background ring-2 ring-primary" label={text.start} />
      <Swatch
        className="bg-secondary"
        label={algorithm === "dfs" ? text.onStack : algorithm === "prim" ? text.couldJoin : text.inStructure(structure)}
      />
      <Swatch className="bg-secondary/45" label={algorithm === "prim" ? text.inTree : text.visited} />
      <Line className="bg-primary" label={text.treeEdge} />
    </>
  );
  return (
    <ul
      aria-label={text.legend}
      className={cn(
        "flex text-xs text-foreground md:text-sm",
        "flex-wrap items-center gap-x-4 gap-y-1",
        className,
      )}
    >
      {items}
    </ul>
  );
};

/** Counters on one line, for the dock. */
export const GraphStatsInline = ({ className }: { className?: string }) => {
  const { stats, total } = useStore(
    useShallow((s) => ({ stats: s.graphs.run.frameAt(s.frameIndex).stats, total: s.graphs.graph.nodes.length })),
  );
  return (
    <p className={cn("whitespace-nowrap font-mono text-xs text-foreground/80", className)}>
      {text.stats(stats.visited, total, stats.examined)}
    </p>
  );
};

/** What the algorithm on stage keeps its nodes in, and how fast it is. */
export const GraphFacts = () => {
  const algorithm = useStore((s) => s.graphs.algorithm);
  const { structure, timeComplexity, weighted } = graphAlgorithms[algorithm];
  return <FactLine facts={[structure, weighted ? text.usesWeights : text.ignoresWeights, timeComplexity]} />;
};
