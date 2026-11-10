import { useShallow } from "zustand/react/shallow";
import { mazeAlgorithms, mazeSizeLabels } from "@/consts/mazeAlgorithms";
import { hasStartCell, type MazeAlgorithm } from "@/mazes";
import { localized } from "@/i18n";
import { gridSizes, raceMaxGridSize, type GridSize } from "@/pathfinding";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { FactLine } from "../ui/fact-line";
import { SegmentedControl } from "../ui/segmented";
import { SwatchCross } from "../TourSwatch";

const text = localized({
  en: {
    size: "Maze size",
    tooBig: (size: string) => `${size}: too small to follow in a race`,
    legend: "Legend",
    start: "Start",
    wall: "Wall",
    carved: "Carved",
    stack: "On the stack",
    frontier: "Frontier",
    picked: "Picked",
    region: "Region",
    otherRegion: "Other region",
    wallCarved: "Wall carved",
    wallSkipped: "Wall skipped",
    walk: "Walk",
    lastStep: "Last step",
    inProgress: "Stack, frontier, region or walk",
    thisStep: "This step",
    current: "Current",
    deadEnd: "Dead-end cell",
    steps: (n: number) => count(n, "step"),
    deadEnds: (n: number) => ` · ${count(n, "dead-end cell")}`,
  },
  es: {
    size: "Tamaño del laberinto",
    tooBig: (size) => `${size}: demasiado pequeño para seguirlo en una carrera`,
    legend: "Leyenda",
    start: "Inicio",
    wall: "Pared",
    carved: "Excavada",
    stack: "En la pila",
    frontier: "Frontera",
    picked: "Elegida",
    region: "Región",
    otherRegion: "Otra región",
    wallCarved: "Pared excavada",
    wallSkipped: "Pared omitida",
    walk: "Caminata",
    lastStep: "Último paso",
    inProgress: "Pila, frontera, región o caminata",
    thisStep: "Este paso",
    current: "Actual",
    deadEnd: "Sin salida",
    steps: (n) => count(n, "paso"),
    deadEnds: (n) => ` · ${n.toLocaleString("es")} sin salida`,
  },
});

/** Small, medium or large: the maze's only setting. */
export const MazeSizePicker = () => {
  const { size, setSize, cap } = useStore(
    useShallow((s) => ({
      size: s.mazes.size,
      setSize: s.actions.mazes.setSize,
      // Races show four mazes at once, so the biggest sizes are off there.
      cap: s.view === "race" ? gridSizes.indexOf(raceMaxGridSize(s.isMobile)) : Infinity,
    })),
  );
  return (
    <SegmentedControl<GridSize>
      label={text.size}
      options={gridSizes.map((value) => ({
        value,
        label: mazeSizeLabels[value],
        disabled: gridSizes.indexOf(value) > cap,
        title: gridSizes.indexOf(value) > cap ? text.tooBig(mazeSizeLabels[value]) : undefined,
      }))}
      value={size}
      onChange={(value) => value !== size && setSize(value)}
    />
  );
};

const Swatch = ({ className, label, cross }: { className: string; label: string; cross?: boolean }) => (
  <li className="flex items-center gap-2">
    <span
      aria-hidden
      className={cn("shrink-0", cross ? "h-3 w-3 rounded-[3px]" : "h-2.5 w-2.5 rounded-full", className)}
    >
      {cross && <SwatchCross />}
    </span>
    {label}
  </li>
);

/** The tones only one generator shows, between the shared ones (start, wall, carved) and the dead ends. */
const ownTones: Record<MazeAlgorithm, { className: string; label: string; cross?: boolean }[]> = {
  dfs: [
    { className: "bg-secondary", label: text.stack },
    { className: "bg-secondary ring-2 ring-outline", label: text.current },
  ],
  prim: [
    { className: "bg-secondary", label: text.frontier },
    { className: "bg-outline", label: text.picked },
  ],
  kruskal: [
    { className: "bg-secondary", label: text.region },
    { className: "bg-primary", label: text.otherRegion },
    { className: "bg-outline", label: text.wallCarved },
    { className: "bg-conflict", label: text.wallSkipped, cross: true },
  ],
  wilson: [
    { className: "bg-secondary", label: text.walk },
    { className: "bg-outline", label: text.lastStep },
  ],
};

/**
 * In a race, every racer's tones at once. Each generator uses the secondary tone for what it's
 * working on and the outline for its move, so those read as one entry each.
 */
const raceTones = (racers: MazeAlgorithm[]) => [
  { className: "bg-secondary", label: text.inProgress },
  { className: "bg-outline", label: text.thisStep },
  ...(racers.includes("kruskal")
    ? [
        { className: "bg-primary", label: text.otherRegion },
        { className: "bg-conflict", label: text.wallSkipped, cross: true },
      ]
    : []),
];

/** What each tone on the grid means: for the generator on stage, or for every racer. */
export const MazeLegend = ({ className }: { className?: string }) => {
  const { algorithm, racers } = useStore(
    useShallow((s) => ({ algorithm: s.mazes.algorithm, racers: s.view === "race" ? s.mazes.racers : null })),
  );
  const tones = racers ? raceTones(racers) : ownTones[algorithm];
  const starts = racers ? racers.some((a) => hasStartCell[a]) : hasStartCell[algorithm];
  return (
    <ul
      data-tour="legend"
      aria-label={text.legend}
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground md:text-sm", className)}
    >
      {starts && <Swatch className="bg-primary ring-2 ring-background" label={text.start} />}
      <Swatch className="bg-bar/55" label={text.wall} />
      <Swatch className="bg-edge ring-1 ring-foreground/40" label={text.carved} />
      {tones.map((tone) => (
        <Swatch key={tone.label} {...tone} />
      ))}
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
