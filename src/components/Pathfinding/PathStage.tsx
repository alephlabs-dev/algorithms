import { useEffect, useRef, type PointerEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { GridRenderer } from "@/canvas/gridRenderer";
import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { useElementSize } from "@/hooks/useElementSize";
import { EMPTY, MUD, WALL, withMarker, withTerrain, type Grid, type PathFrame, type Terrain } from "@/pathfinding";
import { selectLastIndex, selectPathFrame, useStore } from "@/store";
import { count } from "@/utils/count";
import { describeFrame } from "@/utils/describePathFrame";
import { moveDuration } from "@/utils/speed";
import { cn } from "@/utils/cn";
import { localized } from "@/i18n";

const text = localized({
  en: {
    canvas: (label: string) => `${label} Drag to draw walls or move the start and target.`,
    onGrid: (title: string, rows: number, cols: number, frame: string) => `${title} on a ${rows} by ${cols} grid. ${frame}`,
    found: "Path found",
    none: "No path",
    pathCost: (steps: number, cost: number) => `${count(steps, "step")} · cost ${cost} · `,
    lookedAt: (n: number) => `${count(n, "cell")} looked at`,
    tryOther: (name: string) => `Try ${name}`,
    race: "Race them",
  },
  es: {
    canvas: (label) => `${label} Arrastra para dibujar paredes o mover el inicio y el destino.`,
    onGrid: (title, rows, cols, frame) => `${title} en una cuadrícula de ${rows} por ${cols}. ${frame}`,
    // Short, so the pill stays on one line on phones.
    found: "Hay camino",
    none: "Sin camino",
    pathCost: (steps, cost) => `${count(steps, "paso")} · costo ${cost} · `,
    lookedAt: (n) => `${count(n, "celda")} ${n === 1 ? "revisada" : "revisadas"}`,
    tryOther: (name) => `Prueba ${name}`,
    race: "Compáralos",
  },
});


/** What a drag does, decided by where it starts. */
type Drag =
  { kind: "paint"; terrain: Terrain; last: number } | { kind: "marker"; marker: "start" | "end"; last: number };

/** Cells on the straight line between two cells, so a fast drag doesn't leave gaps. */
const cellsBetween = (grid: Grid, from: number, to: number) => {
  const r0 = Math.floor(from / grid.cols);
  const c0 = from % grid.cols;
  const r1 = Math.floor(to / grid.cols);
  const c1 = to % grid.cols;
  const steps = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
  const out: number[] = [];
  for (let k = 1; k <= steps; k++) {
    out.push(Math.round(r0 + ((r1 - r0) * k) / steps) * grid.cols + Math.round(c0 + ((c1 - c0) * k) / steps));
  }
  return out;
};

/**
 * A grid drawn on canvas and edited by dragging. Starting a drag on an empty
 * cell paints the current brush, on a painted cell erases, and on the start or
 * target moves it. Edits go to the shared grid, so every search restarts.
 */
export const GridCanvas = ({ frame, label }: { frame: PathFrame; label: string }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GridRenderer | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const { grid, gridId, speed, isScrubbing, theme } = useStore(
    useShallow((s) => ({
      grid: s.grid,
      gridId: s.gridId,
      speed: s.speed,
      isScrubbing: s.isScrubbing,
      theme: s.theme,
    })),
  );

  useEffect(() => {
    const renderer = new GridRenderer(canvasRef.current!);
    rendererRef.current = renderer;
    return () => renderer.destroy();
  }, []);

  useEffect(() => {
    rendererRef.current?.resize(width, height, window.devicePixelRatio || 1);
  }, [width, height]);

  useEffect(() => {
    rendererRef.current?.refreshColors();
  }, [theme]);

  useEffect(() => {
    // Colors follow the playback pace, like bar moves do.
    rendererRef.current?.update({
      grid,
      frame,
      gridId,
      fade: isScrubbing ? 0 : Math.min(0.25, moveDuration(speed) * 2),
    });
  }, [grid, frame, gridId, speed, isScrubbing]);

  const cellFrom = (event: PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return rendererRef.current?.cellAt(event.clientX - rect.left, event.clientY - rect.top) ?? null;
  };

  const apply = (drag: Drag, cells: number[]) => {
    const { grid: current, editGrid } = useStore.getState();
    let next = current;
    for (const cell of cells) {
      if (drag.kind === "marker") next = withMarker(next, drag.marker, cell);
      else next = withTerrain(next, cell, drag.terrain);
    }
    if (next !== current) editGrid(next);
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const cell = cellFrom(event);
    if (cell === null) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const { grid: current, brush } = useStore.getState();
    if (cell === current.start || cell === current.end) {
      dragRef.current = { kind: "marker", marker: cell === current.start ? "start" : "end", last: cell };
      return;
    }
    const paint: Terrain = brush === "wall" ? WALL : MUD;
    // Starting on a cell that already has the brush's terrain erases instead.
    const drag: Drag = { kind: "paint", terrain: current.cells[cell] === paint ? EMPTY : paint, last: cell };
    dragRef.current = drag;
    apply(drag, [cell]);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const cell = cellFrom(event);
    // Hovering a marker hints that it can be moved.
    if (!drag) {
      const current = useStore.getState().grid;
      event.currentTarget.style.cursor = cell === current.start || cell === current.end ? "grab" : "crosshair";
      return;
    }
    if (cell === null || cell === drag.last) return;
    const path = drag.kind === "marker" ? [cell] : cellsBetween(useStore.getState().grid, drag.last, cell);
    drag.last = cell;
    apply(drag, path);
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <div ref={wrapperRef} className="relative min-h-0 w-full flex-1">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={text.canvas(label)}
        className="absolute inset-0 h-full w-full touch-none select-none"
        style={{ cursor: "crosshair" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    </div>
  );
};

/** The single view: one search on the grid. */
export const PathStage = () => {
  const { grid, frame, algorithm } = useStore(
    useShallow((s) => ({ grid: s.grid, frame: selectPathFrame(s), algorithm: s.pathAlgorithm })),
  );
  const { title } = pathAlgorithms[algorithm];
  return (
    <div data-tour="bars" className="relative flex h-full min-h-0 min-w-0 flex-col">
      <GridCanvas frame={frame} label={text.onGrid(title, grid.rows, grid.cols, describeFrame(frame))} />
      <PathFinishSummary className="pointer-events-none absolute inset-x-2 top-2 flex justify-center" />
    </div>
  );
};

const linkClass =
  "tap-target relative rounded-full text-sm font-semibold underline decoration-line underline-offset-4 hover:decoration-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary";

/** Over the grid when a search ends: what it took, and what to try next. */
const PathFinishSummary = ({ className }: { className?: string }) => {
  const { finished, frame, algorithm, setPathAlgorithm, pathRaceWith } = useStore(
    useShallow((s) => ({
      finished: s.frameIndex > 0 && s.frameIndex === selectLastIndex(s),
      frame: selectPathFrame(s),
      algorithm: s.pathAlgorithm,
      setPathAlgorithm: s.setPathAlgorithm,
      pathRaceWith: s.pathRaceWith,
    })),
  );
  // Point at the instructive comparison for each algorithm.
  const next = algorithm === "astar" ? "dijkstra" : "astar";
  return (
    <div role="status" className={className}>
      {finished && (
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-edge bg-surface/90 px-5 py-2 text-sm shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none">
          <span className={cn("font-semibold", frame.found ? "text-primary" : "text-foreground")}>
            {frame.found ? text.found : text.none}
          </span>
          {/* Phones show the counts in the dock right below; this keeps the pill to one line. */}
          <span className="hidden font-mono text-xs text-foreground/80 sm:inline">
            {frame.found && text.pathCost(frame.stats.pathLength, frame.stats.pathCost)}
            {text.lookedAt(frame.stats.visited)}
          </span>
          <button type="button" onClick={() => setPathAlgorithm(next)} className={linkClass}>
            {text.tryOther(pathAlgorithms[next].short)}
          </button>
          <button type="button" onClick={() => pathRaceWith(algorithm)} className={linkClass}>
            {text.race}
          </button>
        </div>
      )}
    </div>
  );
};
