import { useEffect, useRef, type PointerEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { GridRenderer } from "@/canvas/gridRenderer";
import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { useElementSize } from "@/hooks/useElementSize";
import { EMPTY, MUD, WALL, withMarker, withTerrain, type Grid, type Terrain } from "@/pathfinding";
import { selectLastIndex, selectPathFrame, useStore } from "@/store";
import { count } from "@/utils/count";
import { moveDuration } from "@/utils/speed";
import { cn } from "@/utils/cn";

/** What a drag does, decided by where it starts. */
type Drag = { kind: "paint"; terrain: Terrain; last: number } | { kind: "marker"; marker: "start" | "end"; last: number };

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
 * The grid: drawn on canvas and edited by dragging. Starting a drag on an
 * empty cell paints the current brush, on a painted cell erases, and on the
 * start or target moves it. Any edit restarts the search.
 */
export const PathStage = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GridRenderer | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const { grid, frame, gridId, speed, isScrubbing, theme, algorithm } = useStore(
    useShallow((s) => ({
      grid: s.grid,
      frame: selectPathFrame(s),
      gridId: s.gridId,
      speed: s.speed,
      isScrubbing: s.isScrubbing,
      theme: s.theme,
      algorithm: s.pathAlgorithm,
    }))
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
    rendererRef.current?.update({ grid, frame, gridId, fade: isScrubbing ? 0 : Math.min(0.25, moveDuration(speed) * 2) });
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

  const { title } = pathAlgorithms[algorithm];
  const label = `${title} on a ${grid.rows} by ${grid.cols} grid. ${
    frame.found === null ? `${count(frame.stats.visited, "cell")} looked at.` : frame.found ? `Path found, ${count(frame.stats.pathLength, "step")}.` : "No path."
  } Drag to draw walls or move the start and target.`;

  return (
    <div data-tour="bars" className="relative flex h-full min-h-0 min-w-0 flex-col">
      <div ref={wrapperRef} className="relative min-h-0 w-full flex-1">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={label}
          className="absolute inset-0 h-full w-full touch-none select-none"
          style={{ cursor: "crosshair" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      </div>
      <PathFinishSummary className="pointer-events-none absolute inset-x-2 top-2 flex justify-center" />
    </div>
  );
};

/** Over the grid when a search ends: what it took, and what to try next. */
const PathFinishSummary = ({ className }: { className?: string }) => {
  const { finished, frame, algorithm, setPathAlgorithm } = useStore(
    useShallow((s) => ({
      finished: s.frameIndex > 0 && s.frameIndex === selectLastIndex(s),
      frame: selectPathFrame(s),
      algorithm: s.pathAlgorithm,
      setPathAlgorithm: s.setPathAlgorithm,
    }))
  );
  // Point at the instructive comparison for each algorithm.
  const next = algorithm === "astar" ? "dijkstra" : "astar";
  return (
    <div role="status" className={className}>
      {finished && (
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-edge bg-surface/90 px-5 py-2 text-sm shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none">
          <span className={cn("font-semibold", frame.found ? "text-primary" : "text-foreground")}>
            {frame.found ? "Path found" : "No path"}
          </span>
          <span className="font-mono text-xs text-foreground/80">
            {frame.found && `${count(frame.stats.pathLength, "step")} · cost ${frame.stats.pathCost} · `}
            {count(frame.stats.visited, "cell")} looked at
          </span>
          <button
            type="button"
            onClick={() => setPathAlgorithm(next)}
            className="rounded-full text-sm font-semibold underline decoration-line underline-offset-4 hover:decoration-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            Try {pathAlgorithms[next].short}
          </button>
        </div>
      )}
    </div>
  );
};
