import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { GridRenderer } from "@/canvas/gridRenderer";
import { pathGridCells, pathPalette } from "./paint";
import { pathAlgorithms } from "./algorithms";
import { useElementSize } from "@/hooks/useElementSize";
import { EMPTY, MUD, WALL, type Grid, type PathFrame, type Terrain } from "./types";
import { withMarker, withTerrain } from "./grid";
import { FEEDBACK_MS, isCellQuestion, type CellQuestion } from "@/game";
import { selectGameQuestion, selectLastIndex, selectPathFrame, useStore } from "@/store";
import { engines, selectSpeed } from "@/modules/engine";
import { count } from "@/utils/count";
import { describeFrame } from "./describePathFrame";
import { moveDuration } from "@/utils/speed";
import { cn } from "@/utils/cn";
import { localized } from "@/i18n";
import { GAME_ROOM } from "@/components/Game";

const text = localized({
  en: {
    canvas: (label: string) => `${label} Drag to draw walls or move the start and target.`,
    marked: (label: string, marks: string) => `${label} Marked cells: ${marks}.`,
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
    marked: (label, marks) => `${label} Celdas marcadas: ${marks}.`,
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
 * While guess mode asks about cells (`ask`), they're marked with letters and
 * tapping one answers; the grid can't be edited until it's answered.
 */
export const GridCanvas = ({
  frame,
  label,
  ask,
  answered,
}: {
  frame: PathFrame;
  label: string;
  ask?: CellQuestion | null;
  /** The last answered question, whose letters stay up while its explanation does. */
  answered?: CellQuestion | null;
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GridRenderer | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const { grid, gridId, speed, isScrubbing, theme } = useStore(
    useShallow((s) => ({
      grid: s.pathfinding.grid,
      gridId: s.pathfinding.inputId,
      speed: selectSpeed(s),
      isScrubbing: s.isScrubbing,
      theme: s.theme,
    })),
  );

  useEffect(() => {
    const renderer = new GridRenderer(canvasRef.current!, pathPalette);
    rendererRef.current = renderer;
    return () => renderer.destroy();
  }, []);

  useEffect(() => {
    rendererRef.current?.resize(width, height, window.devicePixelRatio || 1);
  }, [width, height]);

  useEffect(() => {
    rendererRef.current?.refreshColors();
  }, [theme]);

  const marks = useMemo(() => {
    const q = ask ?? answered;
    return q?.options.map((cell, k) => ({ cell, label: q.optionLabels?.[k] ?? String(k + 1) }));
  }, [ask, answered]);

  useEffect(() => {
    // Colors follow the playback pace, like bar moves do.
    rendererRef.current?.update({
      ...pathGridCells(grid, frame),
      gridId,
      fade: isScrubbing ? 0 : Math.min(0.25, moveDuration(speed) * 2),
      marks,
    });
  }, [grid, frame, gridId, speed, isScrubbing, marks]);

  const cellFrom = (event: PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return rendererRef.current?.cellAt(event.clientX - rect.left, event.clientY - rect.top) ?? null;
  };

  const apply = (drag: Drag, cells: number[]) => {
    const { pathfinding, actions } = useStore.getState();
    const current = pathfinding.grid;
    const editGrid = actions.pathfinding.editGrid;
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
    if (ask) {
      if (ask.options.includes(cell)) useStore.getState().answerGame(cell);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const { grid: current, brush } = useStore.getState().pathfinding;
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
      const current = useStore.getState().pathfinding.grid;
      event.currentTarget.style.cursor =
        cell !== null && ask
          ? ask.options.includes(cell)
            ? "pointer"
            : "default"
          : cell === current.start || cell === current.end
            ? "grab"
            : "crosshair";
      return;
    }
    if (cell === null || cell === drag.last) return;
    const path = drag.kind === "marker" ? [cell] : cellsBetween(useStore.getState().pathfinding.grid, drag.last, cell);
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
        aria-label={ask?.marksText ? text.marked(label, ask.marksText) : text.canvas(label)}
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

/**
 * Measures the stage and tells the store how big a cell is with guess mode on, so guess
 * mode only plays where its letters fit. Wider than a phone, guess mode's panel takes
 * GAME_ROOM from the stage: while it's closed, the size is worked out as if open. Phones
 * lose nothing (the question takes the dock's place). Either way the panel can grow a little
 * past what it should take (a long question): a couple of pixels of slack keep guess mode
 * from switching itself off then, which would hide the panel and switch it back on.
 */
const useReportCellSize = (ref: React.RefObject<HTMLDivElement | null>) => {
  const { width, height } = useElementSize(ref);
  const { rows, cols, panelOpen, phone, setCellSize } = useStore(
    useShallow((s) => ({
      phone: s.isMobile,
      rows: s.pathfinding.grid.rows,
      cols: s.pathfinding.grid.cols,
      panelOpen: s.isGameOn && s.view === "single" && engines.pathfinding.gameUnavailable?.(s) === null,
      setCellSize: s.actions.pathfinding.setCellSize,
    })),
  );
  useEffect(() => {
    if (width === 0 || height === 0) return;
    const room = panelOpen || phone ? height : height - GAME_ROOM;
    const size = Math.floor(Math.min(width / cols, room / rows)) + (panelOpen ? 2 : 0);
    const pixelRatio = window.devicePixelRatio || 1;
    const { cellSize, pixelRatio: known } = useStore.getState().pathfinding;
    if (size !== cellSize || pixelRatio !== known) setCellSize(size, pixelRatio);
  }, [width, height, rows, cols, panelOpen, phone, setCellSize]);
};

/**
 * The cells the last answered question marked, while its explanation is up: the explanation
 * names them by letter, so the letters stay on the grid (they can't be tapped any more).
 */
const useAnsweredMarks = (): CellQuestion | null => {
  const feedback = useStore((s) => s.gameFeedback);
  const [shown, setShown] = useState<CellQuestion | null>(null);
  useEffect(() => {
    const q = feedback?.question;
    if (!feedback || !isCellQuestion(q)) return;
    const show = window.setTimeout(() => setShown(q), 0);
    const hide = window.setTimeout(() => setShown(null), Math.max(0, feedback.id + FEEDBACK_MS - Date.now()));
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
      setShown(null);
    };
  }, [feedback]);
  // Only on the run it was about: a new grid or search drops them.
  const run = useStore((s) => s.pathfinding.run);
  return shown && shown.run === run ? shown : null;
};

/** The single view: one search on the grid. */
export const PathStage = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { grid, frame, algorithm, ask } = useStore(
    useShallow((s) => {
      const question = selectGameQuestion(s);
      return {
        grid: s.pathfinding.grid,
        frame: selectPathFrame(s),
        algorithm: s.pathfinding.algorithm,
        ask: isCellQuestion(question) ? question : null,
      };
    }),
  );
  useReportCellSize(ref);
  const answered = useAnsweredMarks();
  const { title } = pathAlgorithms[algorithm];
  return (
    <div ref={ref} data-tour="bars" className="relative flex h-full min-h-0 min-w-0 flex-col">
      <GridCanvas frame={frame} ask={ask} answered={ask ? null : answered} label={text.onGrid(title, grid.rows, grid.cols, describeFrame(frame))} />
      <PathFinishSummary className="pointer-events-none absolute inset-x-2 top-2 flex justify-center" />
    </div>
  );
};

const linkClass =
  "tap-target relative rounded-full text-sm font-semibold underline decoration-line underline-offset-4 hover:decoration-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary";

/** Over the grid when a search ends: what it took, and what to try next. */
const PathFinishSummary = ({ className }: { className?: string }) => {
  const { finished, frame, algorithm, pick, raceWith } = useStore(
    useShallow((s) => ({
      finished: s.frameIndex > 0 && s.frameIndex === selectLastIndex(s),
      frame: selectPathFrame(s),
      algorithm: s.pathfinding.algorithm,
      pick: s.pick,
      raceWith: s.raceWith,
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
          <button type="button" onClick={() => pick("pathfinding", next)} className={linkClass}>
            {text.tryOther(pathAlgorithms[next].short)}
          </button>
          <button type="button" onClick={() => raceWith("pathfinding", algorithm)} className={linkClass}>
            {text.race}
          </button>
        </div>
      )}
    </div>
  );
};
