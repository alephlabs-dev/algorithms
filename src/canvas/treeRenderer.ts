import type { NodeView, Operation, TreeFrame } from "@/structures";
import { hexToRgb, readColors, type CanvasColors, type RGB } from "./theme";

export type TreeRenderInput = {
  frame: TreeFrame;
  /** Changes when the values are replaced wholesale: nodes snap instead of gliding. */
  structureId: number;
  /** Seconds a move takes. 0 snaps (scrubbing, very fast playback). */
  fade: number;
  /** Show each node's balance (AVL). */
  showBalance: boolean;
  /** Every operation in the run; the frame's opIndex says which one is under way. */
  ops: Operation[];
};

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const css = (c: RGB, alpha = 1) => `rgb(${c[0] | 0} ${c[1] | 0} ${c[2] | 0} / ${alpha})`;
const luminance = (c: RGB) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;

type Place = { x: number; y: number; scale: number };

/** Room kept along the top for the operations queue. */
const QUEUE_HEIGHT = 52;

/**
 * Draws a binary tree: nodes laid out by their order left to right and their
 * depth top to bottom, gliding to new places when the tree changes shape (a
 * rotation reads as nodes swapping levels), with the operation's path and
 * the node it's on highlighted.
 */
export class TreeRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private width = 0;
  private height = 0;
  private dpr = 1;
  private input: TreeRenderInput | null = null;
  private palette = this.paletteFor(readColors());
  private shown = new Map<number, Place>();
  private lastTick = 0;
  private request = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
  }

  destroy() {
    cancelAnimationFrame(this.request);
    this.request = 0;
  }

  refreshColors() {
    this.palette = this.paletteFor(readColors());
    this.draw();
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.shown.clear();
    this.update(this.input);
  }

  update(input: TreeRenderInput | null) {
    const previous = this.input;
    this.input = input;
    if (!input) return;
    if (!previous || previous.structureId !== input.structureId) this.shown.clear();
    this.start();
  }

  private paletteFor(colors: CanvasColors) {
    const background = hexToRgb(colors.background);
    const muted = hexToRgb(colors.muted);
    const secondary = hexToRgb(colors.secondary);
    const isLight = luminance(background) > 0.5;
    return {
      background,
      ink: hexToRgb(colors.foreground),
      node: mix(background, hexToRgb(colors.edge), 0.9),
      ring: mix(background, muted, 0.7),
      edge: mix(background, muted, 0.55),
      path: mix(background, secondary, isLight ? 0.3 : 0.42),
      focus: secondary,
      done: hexToRgb(colors.primary),
      warn: hexToRgb(colors.tertiary),
    };
  }

  /** Where every node goes: x by its place in sorted order, y by its depth. */
  private layout(frame: TreeFrame, reserved: number) {
    const byId = new Map(frame.nodes.map((n) => [n.id, n]));
    const order: number[] = [];
    const depth = new Map<number, number>();
    const walk = (id: number | null, d: number) => {
      if (id === null) return;
      const n = byId.get(id)!;
      walk(n.left, d + 1);
      order.push(id);
      depth.set(id, d);
      walk(n.right, d + 1);
    };
    walk(frame.root, 0);
    const levels = Math.max(1, frame.height + 1);
    const count = Math.max(1, order.length);
    const pad = 28;
    const gap = Math.min(72, (this.height - 2 * pad - reserved) / Math.max(1, levels - 1 || 1));
    const column = (this.width - 2 * pad) / count;
    const radius = Math.max(11, Math.min(22, column * 0.42, gap * 0.36));
    const treeHeight = gap * (levels - 1);
    const top = Math.max(pad + reserved, (this.height + reserved - treeHeight) / 2);
    const target = new Map<number, { x: number; y: number }>();
    order.forEach((id, k) => target.set(id, { x: pad + (k + 0.5) * column, y: top + depth.get(id)! * gap }));
    return { byId, target, radius };
  }

  private start() {
    if (this.request) return;
    this.lastTick = performance.now();
    this.request = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    const dt = Math.min(0.05, (now - this.lastTick) / 1000);
    this.lastTick = now;
    const busy = this.draw(dt);
    this.request = busy ? requestAnimationFrame(this.tick) : 0;
  };

  /** Moves every node towards its place, then paints. Returns whether anything is still moving. */
  private draw(dt = 0): boolean {
    const { ctx, dpr, width, height, input } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!input || width === 0 || height === 0) return false;
    const { frame, showBalance } = input;
    const p = this.palette;
    // Once it's started, a strip along the top keeps the whole queue in view.
    const showQueue = frame.opIndex >= 0 && input.ops.length > 1;
    const { byId, target, radius } = this.layout(frame, showQueue ? QUEUE_HEIGHT : 0);
    const snap = this.reducedMotion.matches || input.fade === 0;
    const blend = snap ? 1 : 1 - Math.exp(-dt / Math.max(0.03, input.fade / 3));
    let busy = false;

    for (const id of [...this.shown.keys()]) if (!target.has(id)) this.shown.delete(id);
    for (const [id, to] of target) {
      const at = this.shown.get(id);
      if (!at) {
        // A new node grows in where it belongs.
        this.shown.set(id, { ...to, scale: snap ? 1 : 0.4 });
        busy = busy || !snap;
        continue;
      }
      at.x += (to.x - at.x) * blend;
      at.y += (to.y - at.y) * blend;
      at.scale += (1 - at.scale) * blend;
      if (Math.abs(to.x - at.x) < 0.3 && Math.abs(to.y - at.y) < 0.3 && Math.abs(1 - at.scale) < 0.01) {
        Object.assign(at, to, { scale: 1 });
      } else busy = true;
    }

    if (showQueue) this.drawQueue(input.ops, frame.opIndex);
    const waiting = frame.opIndex < 0 ? input.ops.filter((op) => op.kind === "insert").map((op) => op.value) : [];
    if (frame.root === null) {
      if (waiting.length) this.drawWaiting(waiting);
      else {
        ctx.fillStyle = css(p.ring);
        ctx.font = `500 15px "Instrument Sans", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Empty tree: insert a value", width / 2, height / 2);
      }
      return busy;
    }

    const path = new Set(frame.path);
    const event = frame.event;
    const highlighted = (id: number) =>
      (event.type === "found" || event.type === "place") && event.node === id
        ? p.done
        : event.type === "rotate" && (event.pivot === id || event.up === id)
          ? p.done
          : frame.focus === id
            ? p.focus
            : path.has(id)
              ? p.path
              : p.node;

    // Edges from each node to its children, behind the nodes.
    ctx.strokeStyle = css(p.edge);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (const node of frame.nodes) {
      const from = this.shown.get(node.id);
      if (!from) continue;
      for (const child of [node.left, node.right]) {
        const to = child === null ? null : this.shown.get(child);
        if (!to) continue;
        const onPath = path.has(node.id) && path.has(child!);
        ctx.strokeStyle = css(onPath ? p.focus : p.edge, onPath ? 0.9 : 1);
        ctx.lineWidth = onPath ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    }

    for (const node of frame.nodes) this.drawNode(node, highlighted(node.id), radius, showBalance, byId.size);
    this.drawCarried(frame, radius);
    return busy;
  }

  /**
   * The value an operation is carrying down: above the root as it starts, then
   * beside each node it's compared with, leaning to the side it'll go next.
   */
  private drawCarried(frame: TreeFrame, radius: number) {
    const event = frame.event;
    let at: Place | undefined;
    let value: number;
    let lean: "left" | "right" | "here" = "here";
    if (event.type === "start" && frame.root !== null) {
      at = this.shown.get(frame.root);
      value = event.op.value;
    } else if (event.type === "compare") {
      at = this.shown.get(event.node);
      value = event.value;
      lean = event.go;
    } else return;
    if (!at) return;
    const { ctx } = this;
    const p = this.palette;
    const r = Math.max(10, radius * 0.72);
    const dx = lean === "left" ? -1 : lean === "right" ? 1 : 0;
    const x = at.x + dx * (radius + r * 0.6);
    const y = at.y - radius - r - (dx ? 0 : 4);
    ctx.fillStyle = css(p.focus);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = css(p.background);
    ctx.lineWidth = 2;
    ctx.stroke();
    const ink =
      Math.abs(luminance(p.focus) - luminance(p.ink)) > Math.abs(luminance(p.focus) - luminance(p.background));
    ctx.fillStyle = css(ink ? p.ink : p.background);
    ctx.font = `600 ${Math.round(r * 0.9)}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(value!), x, y + 1);
  }

  /** The operations in order, as a strip along the top: done ones faded, the current one ringed. */
  private drawQueue(ops: Operation[], current: number) {
    const { ctx, width } = this;
    const p = this.palette;
    const r = width > 700 ? 15 : 12;
    const step = r * 2 + 8;
    const fits = Math.max(1, Math.floor((width - 24) / step));
    // Keep the current one in view, with one done op before it for context.
    const first = Math.max(0, Math.min(current - 1, ops.length - fits));
    const shown = ops.slice(first, first + fits);
    const y = 8 + r;
    const x0 = width / 2 - ((shown.length - 1) * step) / 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    shown.forEach((op, k) => {
      const index = first + k;
      const x = x0 + k * step;
      const done = index < current;
      const now = index === current;
      ctx.globalAlpha = done ? 0.35 : 1;
      ctx.fillStyle = css(now ? p.focus : p.node);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = css(now ? p.focus : p.ring);
      ctx.lineWidth = 1.5;
      if (op.kind === "delete") ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      const ink = now
        ? Math.abs(luminance(p.focus) - luminance(p.ink)) > Math.abs(luminance(p.focus) - luminance(p.background))
        : true;
      ctx.fillStyle = css(ink ? p.ink : p.background);
      ctx.font = `600 ${r - 1}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.fillText(String(op.value), x, y + 1);
      // Find and delete get a mark, so the strip reads as a list of operations, not just values.
      if (op.kind !== "insert") {
        ctx.fillStyle = css(p.ink);
        ctx.beginPath();
        ctx.arc(x + r * 0.75, y - r * 0.75, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = css(p.background);
        ctx.font = `700 9px "JetBrains Mono", ui-monospace, monospace`;
        ctx.fillText(op.kind === "search" ? "?" : "×", x + r * 0.75, y - r * 0.75 + 0.5);
      }
    });
    ctx.globalAlpha = 1;
    // Fades at the ends say there's more off the strip.
    if (first > 0) this.queueMore(x0 - step * 0.75, y, "‹");
    if (first + shown.length < ops.length) this.queueMore(x0 + shown.length * step - step * 0.25, y, "›");
  }

  private queueMore(x: number, y: number, mark: string) {
    const { ctx } = this;
    ctx.fillStyle = css(this.palette.ring);
    ctx.font = `600 14px "Instrument Sans", system-ui, sans-serif`;
    ctx.fillText(mark, x, y);
  }

  /** The values about to be inserted, as a queue of outlined nodes, the next one ringed. */
  private drawWaiting(values: number[]) {
    const { ctx, width, height } = this;
    const p = this.palette;
    const r = height < 260 ? 13 : 16;
    const step = r * 2 + 10;
    const perRow = Math.max(1, Math.min(values.length, Math.floor((width - 32) / step)));
    const rows = Math.ceil(values.length / perRow);
    const label = 30;
    const top = Math.max(label + 20, (height - rows * step + 10 + label) / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = css(p.ink, 0.75);
    ctx.font = `500 15px "Instrument Sans", system-ui, sans-serif`;
    const long = `Press play to insert ${values.length === 1 ? "1 value" : `${values.length} values`}, in this order`;
    ctx.fillText(ctx.measureText(long).width < width - 32 ? long : "Press play to insert", width / 2, top - label);
    values.forEach((value, k) => {
      const row = Math.floor(k / perRow);
      const inRow = Math.min(perRow, values.length - row * perRow);
      const x = width / 2 + ((k % perRow) - (inRow - 1) / 2) * step;
      const y = top + r + row * step;
      ctx.fillStyle = css(p.node);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = css(k === 0 ? p.focus : p.ring);
      ctx.lineWidth = k === 0 ? 2.5 : 1.5;
      ctx.stroke();
      ctx.fillStyle = css(p.ink, k === 0 ? 1 : 0.7);
      ctx.font = `600 13px "JetBrains Mono", ui-monospace, monospace`;
      ctx.fillText(String(value), x, y + 1);
    });
  }

  private drawNode(node: NodeView, fill: RGB, radius: number, showBalance: boolean, count: number) {
    const { ctx } = this;
    const p = this.palette;
    const at = this.shown.get(node.id);
    if (!at) return;
    const r = radius * at.scale;
    ctx.fillStyle = css(fill);
    ctx.beginPath();
    ctx.arc(at.x, at.y, r, 0, Math.PI * 2);
    ctx.fill();
    if (fill === p.node) {
      ctx.strokeStyle = css(p.ring);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (this.input!.frame.focus === node.id) {
      ctx.strokeStyle = css(p.ink);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(at.x, at.y, r + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    const ink = Math.abs(luminance(fill) - luminance(p.ink)) > Math.abs(luminance(fill) - luminance(p.background));
    ctx.fillStyle = css(ink ? p.ink : p.background);
    ctx.font = `600 ${Math.round(r * 0.82)}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(node.value), at.x, at.y + 1);

    // AVL: the balance, in a badge that turns to the warning color when it's out of range.
    if (showBalance && count > 0) {
      const text = node.balance > 0 ? `+${node.balance}` : String(node.balance);
      const size = Math.max(9, Math.round(radius * 0.5));
      ctx.font = `600 ${size}px "JetBrains Mono", ui-monospace, monospace`;
      const w = Math.max(size * 1.6, ctx.measureText(text).width + size * 0.7);
      const bx = at.x + r * 0.85;
      const by = at.y - r * 0.85;
      const off = Math.abs(node.balance) > 1;
      ctx.fillStyle = css(off ? p.warn : p.ink);
      ctx.beginPath();
      ctx.roundRect(bx - w / 2, by - size * 0.7, w, size * 1.4, size * 0.7);
      ctx.fill();
      ctx.fillStyle = css(p.background);
      ctx.fillText(text, bx, by + 0.5);
    }
  }
}
