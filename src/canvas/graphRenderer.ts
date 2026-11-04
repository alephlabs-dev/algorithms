import { DONE, nodeName, PENDING, type Graph, type GraphFrame } from "@/graphs";
import { hexToRgb, readColors, type CanvasColors, type RGB } from "./theme";

export type GraphRenderInput = {
  graph: Graph;
  frame: GraphFrame;
  /** Changes when the graph is replaced wholesale; colors snap instead of fading. */
  graphId: number;
  /** Seconds a color change takes. 0 snaps (scrubbing, very fast playback). */
  fade: number;
  /** Show the weight on each edge. */
  weighted: boolean;
  /** What the badge by each node says: its distance, or when it was visited. */
  label: "distance" | "order";
  /** The node picked while editing (the first of two to join), if any. */
  selected: number | null;
};

const POP_FROM = 0.7; // a node that changes state grows from this scale

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const css = (c: RGB) => `rgb(${c[0] | 0} ${c[1] | 0} ${c[2] | 0})`;
const luminance = (c: RGB) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;

type Layout = { left: number; top: number; width: number; height: number; radius: number };

/**
 * Draws a graph on a canvas: edges, weights, nodes with their letters and a
 * badge for distance or visit order. Colors fade and nodes pop when the search
 * reaches them; runs its own loop only while something is moving.
 */
export class GraphRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private width = 0;
  private height = 0;
  private dpr = 1;
  private input: GraphRenderInput | null = null;
  private colors = readColors();
  private palette = this.paletteFor(this.colors);
  private nodeRgb: RGB[] = [];
  private edgeRgb: RGB[] = [];
  private edgeWidth: number[] = [];
  private shown: number[] = [];
  private scale: number[] = [];
  private velocity: number[] = [];
  private lastTick = 0;
  private frameRequest = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
  }

  destroy() {
    cancelAnimationFrame(this.frameRequest);
    this.frameRequest = 0;
  }

  refreshColors() {
    this.colors = readColors();
    this.palette = this.paletteFor(this.colors);
    this.snap();
    this.start();
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.draw();
  }

  update(input: GraphRenderInput) {
    const previous = this.input;
    this.input = input;
    const fresh =
      !previous ||
      previous.graphId !== input.graphId ||
      previous.graph.nodes.length !== input.graph.nodes.length ||
      previous.graph.edges.length !== input.graph.edges.length;
    if (fresh) {
      this.snap();
    } else if (!this.reducedMotion.matches && input.fade > 0) {
      // New states pop in; going back (stepping backwards) just fades.
      input.graph.nodes.forEach((_, k) => {
        const state = input.frame.states[k];
        if (state > this.shown[k]) this.scale[k] = POP_FROM;
        this.shown[k] = state;
      });
    } else {
      input.graph.nodes.forEach((_, k) => (this.shown[k] = input.frame.states[k]));
    }
    this.start();
  }

  /** The node under a point on the canvas (CSS pixels), if any. */
  nodeAt(x: number, y: number): number | null {
    const input = this.input;
    if (!input) return null;
    const layout = this.layout();
    let best: number | null = null;
    let bestDistance = layout.radius * 1.5;
    input.graph.nodes.forEach((node, k) => {
      const [nx, ny] = this.position(layout, node);
      const d = Math.hypot(nx - x, ny - y);
      if (d < bestDistance) {
        best = k;
        bestDistance = d;
      }
    });
    return best;
  }

  /** A point on the canvas as a place in the layout (0–1 each way). */
  toLayout(x: number, y: number) {
    const { left, top, width, height } = this.layout();
    return { x: (x - left) / width, y: (y - top) / height };
  }

  private paletteFor(colors: CanvasColors) {
    const background = hexToRgb(colors.background);
    const secondary = hexToRgb(colors.secondary);
    const edge = hexToRgb(colors.edge);
    const muted = hexToRgb(colors.muted);
    const isLight = luminance(background) > 0.5;
    return {
      background,
      foreground: hexToRgb(colors.foreground),
      unseen: mix(background, edge, 0.9),
      unseenRing: mix(background, muted, 0.7),
      pending: secondary,
      done: mix(background, secondary, isLight ? 0.3 : 0.42),
      idleEdge: mix(background, muted, 0.55),
      tentative: secondary,
      tree: hexToRgb(colors.primary),
      looking: hexToRgb(colors.outline),
      muted,
    };
  }

  private nodeTarget(k: number): RGB {
    const state = this.input!.frame.states[k];
    const p = this.palette;
    return state === PENDING ? p.pending : state === DONE ? p.done : p.unseen;
  }

  /** An edge's color and width: in the tree (final or not), being looked at, or idle. */
  private edgeTarget(e: number): [RGB, number] {
    const { graph, frame } = this.input!;
    const p = this.palette;
    if (frame.edge === e) return [p.looking, 4];
    const { a, b } = graph.edges[e];
    const child = frame.parent[a] === e ? a : frame.parent[b] === e ? b : -1;
    if (child >= 0) return frame.states[child] === DONE ? [p.tree, 4] : [p.tentative, 3];
    return [p.idleEdge, 2];
  }

  private snap() {
    const input = this.input;
    if (!input) return;
    this.nodeRgb = input.graph.nodes.map((_, k) => this.nodeTarget(k));
    this.edgeRgb = input.graph.edges.map((_, e) => this.edgeTarget(e)[0]);
    this.edgeWidth = input.graph.edges.map((_, e) => this.edgeTarget(e)[1]);
    this.shown = input.graph.nodes.map((_, k) => input.frame.states[k]);
    this.scale = input.graph.nodes.map(() => 1);
    this.velocity = input.graph.nodes.map(() => 0);
  }

  private layout(): Layout {
    const aspect = this.input?.graph.aspect ?? 1.8;
    const radius = Math.max(12, Math.min(24, Math.min(this.width / aspect, this.height) * 0.05));
    const pad = radius * 1.6;
    const availW = Math.max(1, this.width - 2 * pad);
    const availH = Math.max(1, this.height - 2 * pad);
    const width = Math.min(availW, availH * aspect);
    const height = width / aspect;
    return { left: (this.width - width) / 2, top: (this.height - height) / 2, width, height, radius };
  }

  private position(layout: Layout, node: { x: number; y: number }): [number, number] {
    return [layout.left + node.x * layout.width, layout.top + node.y * layout.height];
  }

  private start() {
    if (this.frameRequest) return;
    this.lastTick = performance.now();
    this.frameRequest = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    const dt = Math.min(0.05, (now - this.lastTick) / 1000);
    this.lastTick = now;
    const busy = this.step(dt);
    this.draw();
    this.frameRequest = busy ? requestAnimationFrame(this.tick) : 0;
  };

  private step(dt: number) {
    const input = this.input;
    if (!input) return false;
    const snap = this.reducedMotion.matches || input.fade === 0;
    const blend = snap ? 1 : 1 - Math.exp(-dt / Math.max(0.02, input.fade / 3));
    let busy = false;
    const approach = (current: RGB, target: RGB): RGB => {
      const next = mix(current, target, blend);
      if (next.some((v, i) => Math.abs(v - target[i]) >= 0.5)) {
        busy = true;
        return next;
      }
      return target;
    };
    input.graph.nodes.forEach((_, k) => {
      this.nodeRgb[k] = approach(this.nodeRgb[k] ?? this.nodeTarget(k), this.nodeTarget(k));
      if (this.scale[k] !== 1 || this.velocity[k] !== 0) {
        if (snap) {
          this.scale[k] = 1;
          this.velocity[k] = 0;
          return;
        }
        // An underdamped spring, so pops overshoot a touch and settle.
        this.velocity[k] += (260 * (1 - this.scale[k]) - 22 * this.velocity[k]) * dt;
        this.scale[k] += this.velocity[k] * dt;
        if (Math.abs(1 - this.scale[k]) < 0.002 && Math.abs(this.velocity[k]) < 0.01) {
          this.scale[k] = 1;
          this.velocity[k] = 0;
        } else busy = true;
      }
    });
    input.graph.edges.forEach((_, e) => {
      const [target, width] = this.edgeTarget(e);
      this.edgeRgb[e] = approach(this.edgeRgb[e] ?? target, target);
      const w = this.edgeWidth[e] ?? width;
      const nextWidth = snap ? width : w + (width - w) * blend;
      this.edgeWidth[e] = Math.abs(nextWidth - width) < 0.05 ? width : nextWidth;
      if (this.edgeWidth[e] !== width) busy = true;
    });
    return busy;
  }

  private draw() {
    const { ctx, dpr, width, height, input } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!input || width === 0 || height === 0) return;
    const { graph, frame } = input;
    const layout = this.layout();
    const r = layout.radius;
    const p = this.palette;
    const at = graph.nodes.map((node) => this.position(layout, node));
    ctx.lineCap = "round";

    // Edges first, so nodes sit on top of them.
    graph.edges.forEach((edge, e) => {
      const [ax, ay] = at[edge.a];
      const [bx, by] = at[edge.b];
      ctx.strokeStyle = css(this.edgeRgb[e] ?? p.idleEdge);
      ctx.lineWidth = this.edgeWidth[e] ?? 2;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    });

    if (input.weighted) {
      const size = Math.max(10, Math.round(r * 0.62));
      ctx.font = `500 ${size}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      graph.edges.forEach((edge, e) => {
        const x = (at[edge.a][0] + at[edge.b][0]) / 2;
        const y = (at[edge.a][1] + at[edge.b][1]) / 2;
        const pill = size * 0.95;
        ctx.fillStyle = css(p.background);
        ctx.beginPath();
        ctx.roundRect(x - pill * 0.7, y - pill * 0.62, pill * 1.4, pill * 1.24, pill * 0.4);
        ctx.fill();
        const strong = (this.edgeWidth[e] ?? 2) > 2.5;
        ctx.fillStyle = css(strong ? (this.edgeRgb[e] ?? p.muted) : p.muted);
        ctx.fillText(String(edge.w), x, y + 0.5);
      });
    }

    graph.nodes.forEach((_, k) => {
      const [x, y] = at[k];
      const radius = r * (this.scale[k] ?? 1);
      const fill = this.nodeRgb[k] ?? p.unseen;
      // The start wears a ring in the tree color; the node being visited, a bright outline.
      if (k === graph.start) {
        ctx.strokeStyle = css(p.tree);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, radius + 4.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = css(fill);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      if (frame.states[k] === 0) {
        ctx.strokeStyle = css(p.unseenRing);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      if (frame.current === k) {
        ctx.strokeStyle = css(p.looking);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius + 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (input.selected === k) {
        ctx.strokeStyle = css(p.foreground);
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(x, y, radius + 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // The letter in whichever of the theme's ink and paper stands out more on this fill.
      const ink =
        Math.abs(luminance(fill) - luminance(p.foreground)) > Math.abs(luminance(fill) - luminance(p.background));
      ctx.fillStyle = css(ink ? p.foreground : p.background);
      ctx.font = `600 ${Math.round(radius * 0.9)}px "Instrument Sans", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(nodeName(k), x, y + 1);

      // Distance or visit order, in a small badge above and to the right.
      const value =
        input.label === "distance"
          ? Number.isFinite(frame.dist[k])
            ? String(frame.dist[k])
            : null
          : frame.order[k] >= 0
            ? String(frame.order[k] + 1)
            : null;
      if (value !== null) {
        const size = Math.max(10, Math.round(r * 0.58));
        ctx.font = `600 ${size}px "JetBrains Mono", ui-monospace, monospace`;
        const w = Math.max(size * 1.3, ctx.measureText(value).width + size * 0.8);
        const bx = x + r * 0.75;
        const by = y - r * 0.95;
        ctx.fillStyle = css(p.foreground);
        ctx.beginPath();
        ctx.roundRect(bx - w / 2, by - size * 0.68, w, size * 1.36, size * 0.68);
        ctx.fill();
        ctx.fillStyle = css(p.background);
        ctx.fillText(value, bx, by + 0.5);
      }
    });
  }
}
