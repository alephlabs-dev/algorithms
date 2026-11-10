import { useShallow } from "zustand/react/shallow";
import { gridSizeLabels, presets } from "./labels";
import { MUD_COST } from "./types";
import { gridSizes, raceMaxGridSize, type GridSize } from "@/utils/gridSize";
import { selectPathFrame, useStore } from "@/store";
import type { Brush } from "./slice";
import { cn } from "@/utils/cn";
import { PresetButtons as LayoutButtons } from "@/components/ui/preset-buttons";
import { SegmentedControl } from "@/components/ui/segmented";
import { localized } from "@/i18n";

const text = localized({
  en: {
    brush: "Brush",
    wall: "Wall",
    wallTitle: "Drag to draw walls (drag over a wall to erase)",
    mud: (cost: number) => `Mud ×${cost}`,
    mudTitle: (cost: number) => `Mud can be crossed but costs ${cost} steps`,
    tools: "Grid tools",
    gridSize: "Grid size",
    tooBig: (size: string) => `${size}: too small to follow in a race`,
    legend: "Legend",
    start: "Start",
    target: "Target",
    toExplore: "To explore",
    explored: "Explored",
    path: "Path",
    mudLegend: (cost: number) => `Mud (×${cost})`,
    statsExplored: (n: number) => `${n} explored`,
    statsPath: (n: number) => ` · path ${n}`,
  },
  es: {
    brush: "Pincel",
    wall: "Pared",
    wallTitle: "Arrastra para dibujar paredes (arrastra sobre una pared para borrarla)",
    mud: (cost) => `Barro ×${cost}`,
    mudTitle: (cost) => `El barro se puede cruzar, pero cuesta ${cost} pasos`,
    tools: "Herramientas de la cuadrícula",
    gridSize: "Tamaño de la cuadrícula",
    tooBig: (size) => `${size}: demasiado pequeña para seguirla en una carrera`,
    legend: "Leyenda",
    start: "Inicio",
    target: "Destino",
    toExplore: "Por explorar",
    explored: "Explorada",
    path: "Camino",
    mudLegend: (cost) => `Barro (×${cost})`,
    statsExplored: (n) => `${n} exploradas`,
    statsPath: (n) => ` · camino ${n}`,
  },
});


/** What dragging paints. Shared by the tools row and the settings. */
export const BrushPicker = ({ className }: { className?: string }) => {
  const { brush, setBrush } = useStore(useShallow((s) => ({ brush: s.pathfinding.brush, setBrush: s.actions.pathfinding.setBrush })));
  return (
    <SegmentedControl<Brush>
      label={text.brush}
      options={[
        { value: "wall", label: text.wall, title: text.wallTitle },
        { value: "mud", label: text.mud(MUD_COST), title: text.mudTitle(MUD_COST) },
      ]}
      value={brush}
      onChange={setBrush}
      compact
      className={className}
    />
  );
};

/** Ready-made layouts, one tap each. */
export const PresetButtons = ({ className }: { className?: string }) => {
  const { apply, current } = useStore(useShallow((s) => ({ apply: s.actions.pathfinding.applyGridPreset, current: s.pathfinding.gridPreset })));
  return <LayoutButtons presets={presets} current={current} onPick={apply} className={className} />;
};

/** Above the grid: the brush and the layouts, always at hand since editing is the point. */
export const PathTools = ({ className }: { className?: string }) => (
  <div
    data-tour="tools"
    role="toolbar"
    aria-label={text.tools}
    className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 self-start", className)}
  >
    <BrushPicker className="w-44" />
    <PresetButtons />
  </div>
);

export const GridSizePicker = () => {
  const { gridSize, setGridSize, cap } = useStore(
    useShallow((s) => ({
      gridSize: s.pathfinding.gridSize,
      setGridSize: s.actions.pathfinding.setGridSize,
      // Races show four grids at once, so the biggest sizes are off there.
      cap: s.view === "race" ? gridSizes.indexOf(raceMaxGridSize(s.isMobile)) : Infinity,
    }))
  );
  return (
    <SegmentedControl<GridSize>
      label={text.gridSize}
      options={(Object.keys(gridSizeLabels) as GridSize[]).map((size) => ({
        value: size,
        label: gridSizeLabels[size],
        disabled: gridSizes.indexOf(size) > cap,
        title: gridSizes.indexOf(size) > cap ? text.tooBig(gridSizeLabels[size]) : undefined,
      }))}
      value={gridSize}
      onChange={(size) => size !== gridSize && setGridSize(size)}
    />
  );
};

const Swatch = ({ className, label }: { className: string; label: string }) => (
  <li className="flex items-center gap-2">
    <span aria-hidden className={cn("h-2.5 w-2.5 shrink-0 rounded-full", className)} />
    {label}
  </li>
);

/** What each color on the grid means. */
export const PathLegend = ({ className }: { className?: string }) => (
  <ul
    aria-label={text.legend}
    className={cn(
      "flex text-xs text-foreground md:text-sm",
      "flex-wrap items-center gap-x-4 gap-y-1",
      className,
    )}
  >
    <Swatch className="bg-primary ring-2 ring-background" label={text.start} />
    <Swatch className="bg-background ring-2 ring-foreground" label={text.target} />
    <Swatch className="bg-secondary" label={text.toExplore} />
    <Swatch className="bg-secondary/40" label={text.explored} />
    <Swatch className="bg-primary" label={text.path} />
    <Swatch className="bg-mud" label={text.mudLegend(MUD_COST)} />
  </ul>
);

/** Counters on one line, for the dock. */
export const PathStatsInline = ({ className }: { className?: string }) => {
  const stats = useStore((s) => selectPathFrame(s).stats);
  return (
    <p className={cn("whitespace-nowrap font-mono text-xs text-foreground/80", className)}>
      {text.statsExplored(stats.visited)}
      {stats.pathLength > 0 && text.statsPath(stats.pathLength)}
    </p>
  );
};
