import { useShallow } from "zustand/react/shallow";
import { mazeAlgorithms, mazeSizeLabels } from "@/consts/mazeAlgorithms";
import { localized } from "@/i18n";
import { gridSizes, type GridSize } from "@/pathfinding";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { FactLine } from "../ui/fact-line";
import { SegmentedControl } from "../ui/segmented";

const text = localized({
  en: {
    size: "Maze size",
    legend: "Legend",
    start: "Start",
    wall: "Wall",
    carved: "Carved",
    stack: "On the stack",
    frontier: "Frontier",
    picked: "Picked",
    current: "Current",
    deadEnd: "Dead-end cell",
    steps: (n: number) => count(n, "step"),
    deadEnds: (n: number) => ` · ${count(n, "dead-end cell")}`,
  },
  es: {
    size: "Tamaño del laberinto",
    legend: "Leyenda",
    start: "Inicio",
    wall: "Pared",
    carved: "Excavada",
    stack: "En la pila",
    frontier: "Frontera",
    picked: "Elegida",
    current: "Actual",
    deadEnd: "Sin salida",
    steps: (n) => count(n, "paso"),
    deadEnds: (n) => ` · ${n.toLocaleString("es")} sin salida`,
  },
});

/** Small, medium or large: the maze's only setting. */
export const MazeSizePicker = () => {
  const { size, setSize } = useStore(useShallow((s) => ({ size: s.mazes.size, setSize: s.actions.mazes.setSize })));
  return (
    <SegmentedControl<GridSize>
      label={text.size}
      options={gridSizes.map((value) => ({ value, label: mazeSizeLabels[value] }))}
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

/** What each tone on the grid means, for the generator on stage. */
export const MazeLegend = ({ className }: { className?: string }) => {
  const algorithm = useStore((s) => s.mazes.algorithm);
  return (
    <ul
      data-tour="legend"
      aria-label={text.legend}
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground md:text-sm", className)}
    >
      <Swatch className="bg-primary ring-2 ring-background" label={text.start} />
      <Swatch className="bg-bar/55" label={text.wall} />
      <Swatch className="bg-edge ring-1 ring-foreground/40" label={text.carved} />
      {algorithm === "prim" ? (
        <>
          <Swatch className="bg-secondary" label={text.frontier} />
          <Swatch className="bg-primary ring-2 ring-outline" label={text.picked} />
        </>
      ) : (
        <>
          <Swatch className="bg-secondary" label={text.stack} />
          <Swatch className="bg-secondary ring-2 ring-outline" label={text.current} />
        </>
      )}
      <Swatch className="bg-tertiary" label={text.deadEnd} />
    </ul>
  );
};

/** Counters on one line, for the dock: steps, and once it's done, the dead-end cells. */
export const MazeStatsInline = ({ className }: { className?: string }) => {
  const stats = useStore((s) => s.mazes.run.frameAt(s.frameIndex).stats);
  return (
    <p data-tour="stats" className={cn("whitespace-nowrap font-mono text-xs text-foreground/80", className)}>
      {text.steps(stats.steps)}
      {stats.deadEnds !== null && text.deadEnds(stats.deadEnds)}
    </p>
  );
};

/** How the generator on stage works and what it leaves, in one line. */
export const MazeFacts = () => {
  const algorithm = useStore((s) => s.mazes.algorithm);
  const { structure, texture, timeComplexity } = mazeAlgorithms[algorithm];
  return <FactLine facts={[structure, texture, timeComplexity]} />;
};
