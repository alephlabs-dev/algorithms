import { useShallow } from "zustand/react/shallow";
import { gridSizeLabels, presets } from "@/consts/pathLabels";
import { MUD_COST, type GridSize } from "@/pathfinding";
import { selectPathFrame, useStore, type Brush } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { SegmentedControl } from "../ui/segmented";

/** What dragging paints. Shared by the tools row and the settings. */
export const BrushPicker = ({ className }: { className?: string }) => {
  const { brush, setBrush } = useStore(useShallow((s) => ({ brush: s.brush, setBrush: s.setBrush })));
  return (
    <SegmentedControl<Brush>
      label="Brush"
      options={[
        { value: "wall", label: "Wall", title: "Drag to draw walls (drag over a wall to erase)" },
        { value: "mud", label: `Mud ×${MUD_COST}`, title: `Mud can be crossed but costs ${MUD_COST} steps` },
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
  const apply = useStore((s) => s.applyGridPreset);
  return (
    <div role="group" aria-label="Layouts" className={cn("flex flex-wrap gap-1", className)}>
      {presets.map((p) => (
        <button
          key={p.value}
          type="button"
          title={p.title}
          onClick={() => apply(p.value)}
          className="h-9 rounded-full px-3 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

/** Above the grid: the brush and the layouts, always at hand since editing is the point. */
export const PathTools = ({ className }: { className?: string }) => (
  <div role="toolbar" aria-label="Grid tools" className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}>
    <BrushPicker className="w-44" />
    <PresetButtons />
  </div>
);

export const GridSizePicker = () => {
  const { gridSize, setGridSize } = useStore(useShallow((s) => ({ gridSize: s.gridSize, setGridSize: s.setGridSize })));
  return (
    <SegmentedControl<GridSize>
      label="Grid size"
      options={(Object.keys(gridSizeLabels) as GridSize[]).map((size) => ({ value: size, label: gridSizeLabels[size] }))}
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
export const PathLegend = ({ className, stacked }: { className?: string; stacked?: boolean }) => (
  <ul
    aria-label="Legend"
    className={cn(
      "flex text-xs text-foreground md:text-sm",
      stacked ? "flex-col gap-1.5" : "flex-wrap items-center gap-x-4 gap-y-1",
      className
    )}
  >
    <Swatch className="bg-primary ring-2 ring-background" label="Start" />
    <Swatch className="bg-background ring-2 ring-foreground" label="Target" />
    <Swatch className="bg-secondary" label="To explore" />
    <Swatch className="bg-secondary/40" label="Explored" />
    <Swatch className="bg-primary" label="Path" />
    <Swatch className="bg-mud" label={`Mud (×${MUD_COST})`} />
  </ul>
);

/** Counters on one line, for the dock. */
export const PathStatsInline = ({ className }: { className?: string }) => {
  const stats = useStore((s) => selectPathFrame(s).stats);
  return (
    <p className={cn("whitespace-nowrap font-mono text-xs text-foreground/80", className)}>
      {count(stats.visited, "cell")} looked at
      {stats.pathLength > 0 && ` · path ${stats.pathLength}`}
    </p>
  );
};
