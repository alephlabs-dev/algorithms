import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { GraphRenderer } from "./renderer";
import { graphAlgorithms } from "./algorithms";
import { useElementSize } from "@/hooks/useElementSize";
import { edgeName, nodeName, withEdgeToggled, withNodeAt, withStart } from "./graph";
import type { GraphAlgorithm, GraphFrame } from "./types";
import { selectLastIndex, useStore } from "@/store";
import { selectSpeed } from "@/modules/engine";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { moveDuration } from "@/utils/speed";
import { localized } from "@/i18n";

const text = localized({
  en: {
    done: (n: number) => `Done: ${count(n, "node")} visited.`,
    soFar: (n: number) => `${count(n, "node")} visited so far.`,
    hint: "Drag a node to move it, tap two nodes to join them, double-tap a node to start there.",
    picked: (name: string) => `${name} picked: tap another node to join or split them.`,
    canvas: (title: string, nodes: number, edges: number, start: string, status: string, hint: string) =>
      `${title} on a graph of ${count(nodes, "node")} and ${count(edges, "edge")}, starting at ${start}. ${status} ${hint}`,
    strip: { queue: "Queue", stack: "Stack", priority: "Open", ready: "Ready", edges: "Edges" },
    order: {
      queue: "front first",
      stack: "bottom to top",
      priority: "closest first",
      ready: "nothing left coming in",
      edges: "lightest first",
    },
    empty: "empty",
    finished: "Done",
    summary: (nodes: number, edges: number) => `${count(nodes, "node")} · ${count(edges, "edge")} looked at`,
    tryOther: (name: string) => `Try ${name}`,
  },
  es: {
    done: (n) => `Listo: ${count(n, "nodo")} ${n === 1 ? "visitado" : "visitados"}.`,
    soFar: (n) => `${count(n, "nodo")} ${n === 1 ? "visitado" : "visitados"} hasta ahora.`,
    hint: "Arrastra un nodo para moverlo, toca dos nodos para unirlos y toca dos veces un nodo para empezar ahí.",
    picked: (name) => `${name} elegido: toca otro nodo para unirlos o separarlos.`,
    canvas: (title, nodes, edges, start, status, hint) =>
      `${title} en un grafo de ${count(nodes, "nodo")} y ${count(edges, "arista")}, empezando en ${start}. ${status} ${hint}`,
    strip: { queue: "Cola", stack: "Pila", priority: "Abiertos", ready: "Listos", edges: "Aristas" },
    order: {
      queue: "el frente primero",
      stack: "de abajo hacia arriba",
      priority: "el más cercano primero",
      ready: "sin aristas de entrada",
      edges: "la más liviana primero",
    },
    // Works after any of the names above, whatever their gender and number.
    empty: "nada",
    finished: "Listo",
    summary: (nodes, edges) => `${count(nodes, "nodo")} · ${count(edges, "arista")} ${edges === 1 ? "revisada" : "revisadas"}`,
    tryOther: (name) => `Prueba ${name}`,
  },
});


const DRAG_THRESHOLD = 5; // px a pointer moves before a press on a node becomes a drag
const DOUBLE_TAP_MS = 320;

/** What a press on a node is doing so far. */
type Press = { node: number; x: number; y: number; dragging: boolean };

/**
 * A graph drawn on canvas and edited by hand: drag a node to move it, tap
 * two nodes to join them (or split them if they're joined), double-tap a node
 * to start there. Edits go to the shared graph, so every run restarts.
 */
export const GraphCanvas = ({ frame, algorithm }: { frame: GraphFrame; algorithm: GraphAlgorithm }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GraphRenderer | null>(null);
  const pressRef = useRef<Press | null>(null);
  const lastTapRef = useRef<{ node: number; time: number } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const { graph, graphId, speed, isScrubbing, theme } = useStore(
    useShallow((s) => ({
      graph: s.graphs.graph,
      graphId: s.graphs.inputId,
      speed: selectSpeed(s),
      isScrubbing: s.isScrubbing,
      theme: s.theme,
    })),
  );
  // Topological sort reads every graph as pointing from the lower letter to the higher.
  const arrows = graph.directed === true || algorithm === "topo";
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
      arrows,
      // Kruskal and topological sort don't start anywhere.
      showStart: algorithm !== "kruskal" && algorithm !== "topo",
      selected,
    });
  }, [graph, frame, graphId, speed, isScrubbing, weighted, label, arrows, algorithm, selected]);

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
    const { graphs, actions } = useStore.getState();
    const current = graphs.graph;
    const editGraph = actions.graphs.edit;
    editGraph(withNodeAt(current, press.node, place.x, place.y));
  };

  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const press = pressRef.current;
    pressRef.current = null;
    event.currentTarget.style.cursor = "grab";
    if (!press || press.dragging) return;
    const { graphs, actions } = useStore.getState();
    const current = graphs.graph;
    const editGraph = actions.graphs.edit;
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

  const status = frame.done ? text.done(frame.stats.visited) : text.soFar(frame.stats.visited);
  const hint =
    selected === null
      ? text.hint
      : text.picked(nodeName(selected));

  return (
    <div ref={wrapperRef} className="relative min-h-0 w-full flex-1">
      <canvas
          ref={canvasRef}
          role="img"
          aria-label={text.canvas(title, graph.nodes.length, graph.edges.length, nodeName(graph.start), status, hint)}
          className="absolute inset-0 h-full w-full touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (pressRef.current = null)}
        />
    </div>
  );
};

/** The single view: one run on the graph, the structure it keeps, and a summary when it's done. */
export const GraphStage = () => {
  const { frame, algorithm } = useStore(
    useShallow((s) => ({ frame: s.graphs.run.frameAt(s.frameIndex), algorithm: s.graphs.algorithm }))
  );
  return (
    <div data-tour="bars" className="relative flex h-full min-h-0 min-w-0 flex-col gap-2">
      <GraphCanvas frame={frame} algorithm={algorithm} />
      <GraphFinishSummary className="pointer-events-none absolute inset-x-2 top-2 flex justify-center" />
      <StructureStrip />
    </div>
  );
};

const STRIP_NAME = text.strip;
const STRIP_ORDER = text.order;

/**
 * The queue, stack or priority queue under the graph: the one thing that
 * makes BFS, DFS and Dijkstra different, shown as it changes. When it's
 * longer than the strip, it scrolls (the stack to its top) and fades at the cut.
 */
const StructureStrip = () => {
  const listRef = useRef<HTMLOListElement>(null);
  const [overflows, setOverflows] = useState(false);
  const { pending, dist, edgeQueue, structure, graph } = useStore(
    useShallow((s) => {
      const frame = s.graphs.run.frameAt(s.frameIndex);
      return {
        pending: frame.pending,
        dist: frame.dist,
        edgeQueue: frame.edgeQueue,
        structure: s.graphs.run.structure,
        graph: s.graphs.graph,
      };
    }),
  );
  // Kruskal lines up edges; every other algorithm, nodes.
  const items =
    structure === "edges"
      ? edgeQueue.map((e) => ({ key: `e${e}`, name: edgeName(graph, e), extra: String(graph.edges[e].w) }))
      : pending.map((node) => ({
          key: `n${node}`,
          name: nodeName(node),
          extra: structure === "priority" ? String(dist[node]) : null,
        }));
  const fromEnd = structure === "stack";

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    setOverflows(list.scrollWidth > list.clientWidth + 1);
    list.scrollLeft = fromEnd ? list.scrollWidth : 0;
  }, [pending, edgeQueue, fromEnd]);

  const fade = overflows
    ? fromEnd
      ? "[mask-image:linear-gradient(to_right,transparent,black_24px)]"
      : "[mask-image:linear-gradient(to_left,transparent,black_24px)]"
    : undefined;

  return (
    <div
      data-tour="structure"
      aria-label={`${STRIP_NAME[structure]}, ${STRIP_ORDER[structure]}: ${items.length ? items.map((i) => i.name).join(", ") : text.empty}`}
      className="flex min-h-11 items-center gap-3 rounded-2xl border border-edge bg-surface py-2 pl-4 pr-2"
    >
      <span className="shrink-0 font-mono text-xs text-foreground/70">
        {STRIP_NAME[structure]}
        <span className="hidden sm:inline"> · {STRIP_ORDER[structure]}</span>
      </span>
      <ol
        ref={listRef}
        aria-hidden
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          fade,
        )}
      >
        {items.length === 0 && <li className="font-mono text-xs text-foreground/50">{text.empty}</li>}
        {items.map((item) => (
          <li
            key={item.key}
            className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 text-sm font-semibold text-background animate-in fade-in zoom-in-75 duration-200 motion-reduce:animate-none"
          >
            {item.name}
            {item.extra !== null && <span className="font-mono text-xs font-normal">{item.extra}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
};

/** Next to try after each one, for the most telling comparison. */
const NEXT: Record<GraphAlgorithm, GraphAlgorithm> = {
  bfs: "dfs",
  dfs: "bfs",
  dijkstra: "prim",
  prim: "kruskal",
  kruskal: "prim",
  topo: "dfs",
};

const linkClass =
  "tap-target relative rounded-full text-sm font-semibold underline decoration-line underline-offset-4 hover:decoration-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary";

/** Over the graph when a run ends: what it took, and what to compare it with. */
const GraphFinishSummary = ({ className }: { className?: string }) => {
  const { finished, stats, algorithm, pick } = useStore(
    useShallow((s) => ({
      finished: s.frameIndex > 0 && s.frameIndex === selectLastIndex(s),
      stats: s.graphs.run.frameAt(s.frameIndex).stats,
      algorithm: s.graphs.algorithm,
      pick: s.pick,
    })),
  );
  const next = NEXT[algorithm];
  return (
    <div role="status" className={className}>
      {finished && (
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-edge bg-surface/90 px-5 py-2 text-sm shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none">
          <span className="font-semibold text-primary">{text.finished}</span>
          <span className={cn("hidden font-mono text-xs text-foreground/80 sm:inline")}>
            {text.summary(stats.visited, stats.examined)}
          </span>
          <button type="button" onClick={() => pick("graphs", next)} className={linkClass}>
            {text.tryOther(graphAlgorithms[next].short)}
          </button>
        </div>
      )}
    </div>
  );
};
