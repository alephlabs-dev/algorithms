import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { GraphRenderer } from "@/canvas/graphRenderer";
import { graphAlgorithms } from "@/consts/graphAlgorithms";
import { useElementSize } from "@/hooks/useElementSize";
import { nodeName, withEdgeToggled, withNodeAt, withStart, type GraphAlgorithm } from "@/graphs";
import { selectLastIndex, useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { moveDuration } from "@/utils/speed";

const DRAG_THRESHOLD = 5; // px a pointer moves before a press on a node becomes a drag
const DOUBLE_TAP_MS = 320;

/** What a press on a node is doing so far. */
type Press = { node: number; x: number; y: number; dragging: boolean };

/**
 * The graph, drawn on canvas and edited by hand: drag a node to move it, tap
 * two nodes to join them (or split them if they're joined), double-tap a node
 * to start there. Any edit restarts the run.
 */
export const GraphStage = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GraphRenderer | null>(null);
  const pressRef = useRef<Press | null>(null);
  const lastTapRef = useRef<{ node: number; time: number } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const { graph, frame, graphId, speed, isScrubbing, theme, algorithm } = useStore(
    useShallow((s) => ({
      graph: s.graph,
      frame: s.graphTimeline.frameAt(s.frameIndex),
      graphId: s.graphId,
      speed: s.speed,
      isScrubbing: s.isScrubbing,
      theme: s.theme,
      algorithm: s.graphAlgorithm,
    })),
  );
  const { weighted, label, title } = graphAlgorithms[algorithm];

  // A new layout drops whatever was picked on the old one.
  const [selectedOn, setSelectedOn] = useState(graphId);
  if (selectedOn !== graphId) {
    setSelectedOn(graphId);
    setSelected(null);
  }

  useEffect(() => {
    const renderer = new GraphRenderer(canvasRef.current!);
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
    rendererRef.current?.update({
      graph,
      frame,
      graphId,
      fade: isScrubbing ? 0 : Math.min(0.3, moveDuration(speed) * 2),
      weighted,
      label,
      selected,
    });
  }, [graph, frame, graphId, speed, isScrubbing, weighted, label, selected]);

  const pointFrom = (event: PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = pointFrom(event);
    const node = rendererRef.current?.nodeAt(x, y) ?? null;
    if (node === null) {
      setSelected(null);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    pressRef.current = { node, x, y, dragging: false };
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = pointFrom(event);
    const press = pressRef.current;
    if (!press) {
      event.currentTarget.style.cursor = rendererRef.current?.nodeAt(x, y) !== null ? "grab" : "default";
      return;
    }
    if (!press.dragging && Math.hypot(x - press.x, y - press.y) < DRAG_THRESHOLD) return;
    press.dragging = true;
    event.currentTarget.style.cursor = "grabbing";
    const place = rendererRef.current!.toLayout(x, y);
    const { graph: current, editGraph } = useStore.getState();
    editGraph(withNodeAt(current, press.node, place.x, place.y));
  };

  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const press = pressRef.current;
    pressRef.current = null;
    event.currentTarget.style.cursor = "grab";
    if (!press || press.dragging) return;
    const { graph: current, editGraph } = useStore.getState();
    const now = performance.now();
    const last = lastTapRef.current;
    lastTapRef.current = { node: press.node, time: now };
    // Two quick taps on the same node: start from it.
    if (last && last.node === press.node && now - last.time < DOUBLE_TAP_MS) {
      lastTapRef.current = null;
      setSelected(null);
      if (press.node !== current.start) editGraph(withStart(current, press.node));
      return;
    }
    if (selected === null || selected === press.node) {
      setSelected(selected === press.node ? null : press.node);
      return;
    }
    editGraph(withEdgeToggled(current, selected, press.node));
    setSelected(null);
  };

  const status = frame.done
    ? `Done: ${count(frame.stats.visited, "node")} visited.`
    : `${count(frame.stats.visited, "node")} visited so far.`;
  const hint =
    selected === null
      ? "Drag a node to move it, tap two nodes to join them, double-tap a node to start there."
      : `${nodeName(selected)} picked: tap another node to join or split them.`;

  return (
    <div data-tour="bars" className="relative flex h-full min-h-0 min-w-0 flex-col gap-2">
      <div ref={wrapperRef} className="relative min-h-0 w-full flex-1">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`${title} on a graph of ${count(graph.nodes.length, "node")} and ${count(graph.edges.length, "edge")}, starting at ${nodeName(graph.start)}. ${status} ${hint}`}
          className="absolute inset-0 h-full w-full touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (pressRef.current = null)}
        />
        <GraphFinishSummary className="pointer-events-none absolute inset-x-2 top-2 flex justify-center" />
      </div>
      <StructureStrip />
    </div>
  );
};

const STRIP_LABEL = { queue: "Queue · front first", stack: "Stack · bottom to top", priority: "Open · closest first" };

/**
 * The queue, stack or priority queue under the graph: the one thing that
 * makes BFS, DFS and Dijkstra different, shown as it changes.
 */
const StructureStrip = () => {
  const { pending, dist, structure } = useStore(
    useShallow((s) => {
      const frame = s.graphTimeline.frameAt(s.frameIndex);
      return { pending: frame.pending, dist: frame.dist, structure: s.graphTimeline.structure };
    }),
  );
  return (
    <div
      data-tour="structure"
      aria-label={`${STRIP_LABEL[structure]}: ${pending.length ? pending.map(nodeName).join(", ") : "empty"}`}
      className="flex min-h-11 items-center gap-3 overflow-x-auto rounded-2xl border border-edge bg-surface px-4 py-2"
    >
      <span className="shrink-0 font-mono text-xs text-foreground/70">{STRIP_LABEL[structure]}</span>
      <ol aria-hidden className="flex items-center gap-1.5">
        {pending.length === 0 && <li className="font-mono text-xs text-foreground/50">empty</li>}
        {pending.map((node) => (
          <li
            key={node}
            className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 font-semibold text-background animate-in fade-in zoom-in-75 duration-200 motion-reduce:animate-none"
          >
            {nodeName(node)}
            {structure === "priority" && <span className="font-mono text-xs font-normal">{dist[node]}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
};

/** Next to try after each one, for the most telling comparison. */
const NEXT: Record<GraphAlgorithm, GraphAlgorithm> = { bfs: "dfs", dfs: "bfs", dijkstra: "bfs" };

const linkClass =
  "rounded-full text-sm font-semibold underline decoration-line underline-offset-4 hover:decoration-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary";

/** Over the graph when a run ends: what it took, and what to compare it with. */
const GraphFinishSummary = ({ className }: { className?: string }) => {
  const { finished, stats, algorithm, setGraphAlgorithm } = useStore(
    useShallow((s) => ({
      finished: s.frameIndex > 0 && s.frameIndex === selectLastIndex(s),
      stats: s.graphTimeline.frameAt(s.frameIndex).stats,
      algorithm: s.graphAlgorithm,
      setGraphAlgorithm: s.setGraphAlgorithm,
    })),
  );
  const next = NEXT[algorithm];
  return (
    <div role="status" className={className}>
      {finished && (
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-edge bg-surface/90 px-5 py-2 text-sm shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none">
          <span className="font-semibold text-primary">Done</span>
          <span className={cn("hidden font-mono text-xs text-foreground/80 sm:inline")}>
            {count(stats.visited, "node")} · {count(stats.examined, "edge")} looked at
          </span>
          <button type="button" onClick={() => setGraphAlgorithm(next)} className={linkClass}>
            Try {graphAlgorithms[next].short}
          </button>
        </div>
      )}
    </div>
  );
};
