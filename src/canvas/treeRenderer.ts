import type { Slot } from "@/game";
import type { NodeView, Operation, TreeFrame } from "@/structures";
import { drawOpsQueue, drawWaiting, QUEUE_HEIGHT, structurePalette } from "./structurePaint";
import { css, inkOn, luminance, readColors, type RGB } from "./theme";
import { localized } from "@/i18n";

const EMPTY = localized({
  en: { heap: "Empty heap: insert a value", tree: "Empty tree: insert a value" },
  es: { heap: "Montículo vacío: inserta un valor", tree: "Árbol vacío: inserta un valor" },
});


export type TreeRenderInput = {
  frame: TreeFrame;
  /** Changes when the values are replaced wholesale: nodes snap instead of gliding. */
  structureId: number;
  /** Seconds a move takes. 0 snaps (scrubbing, very fast playback). */
  fade: number;
  /** Show each node's balance (AVL). */
  showBalance: boolean;
  /** Heap: also draw the array the tree is stored in, under it. */
  array: boolean;
  /** Guess mode: empty spots to tap, where the value might land. */
  slots?: Slot[];
  /** Every operation in the run; the frame's opIndex says which one is under way. */
  ops: Operation[];
};

type Place = { x: number; y: number; scale: number };

/** Room kept along the bottom for a heap's array. */
const ARRAY_HEIGHT = 58;

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
  private palette = structurePalette(readColors());
  private shown = new Map<number, Place>();
  /** Where the guess-mode spots were last drawn, for taps. */
  private spots: { key: string; x: number; y: number; r: number }[] = [];
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
    this.palette = structurePalette(readColors());
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

  /** Where every node goes: x by its place in sorted order, y by its depth. */
  private layout(frame: TreeFrame, reserved: number, bottom: number, extraLevel = false) {
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
    // Guess mode draws spots one level below the deepest node: leave room for them.
    const levels = Math.max(1, frame.height + 1 + (extraLevel ? 1 : 0));
    const count = Math.max(1, order.length);
    const pad = 28;
    const gap = Math.min(72, (this.height - 2 * pad - reserved - bottom) / Math.max(1, levels - 1 || 1));
    const column = (this.width - 2 * pad) / count;
    const radius = Math.max(11, Math.min(22, column * 0.42, gap * 0.36));
    const treeHeight = gap * (levels - 1);
    const top = Math.max(pad + reserved, (this.height + reserved - bottom - treeHeight) / 2);
    const target = new Map<number, { x: number; y: number }>();
    order.forEach((id, k) => target.set(id, { x: pad + (k + 0.5) * column, y: top + depth.get(id)! * gap }));
    return { byId, target, radius, column, gap };
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
    const { byId, target, radius, column, gap } = this.layout(
      frame,
      showQueue ? QUEUE_HEIGHT : 0,
      input.array ? ARRAY_HEIGHT : 0,
      !!input.slots?.length,
    );
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

    if (showQueue) drawOpsQueue(this.ctx, p, width, input.ops, frame.opIndex);
    const waiting = frame.opIndex < 0 ? input.ops.filter((op) => op.kind === "insert").map((op) => op.value) : [];
    if (frame.root === null) {
      if (waiting.length) drawWaiting(this.ctx, p, width, height, waiting);
      else {
        ctx.fillStyle = css(p.ring);
        ctx.font = `500 15px "Instrument Sans", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(input.array ? EMPTY.heap : EMPTY.tree, width / 2, height / 2);
      }
      return busy;
    }

    const path = new Set(frame.path);
    const event = frame.event;
    const highlighted = (id: number): RGB => {
      switch (event.type) {
        case "found":
        case "place":
        case "append":
        case "lift":
          if (event.node === id) return p.done;
          break;
        case "rotate":
          if (event.pivot === id || event.up === id) return p.done;
          break;
        case "swap":
          if (event.node === id || event.other === id) return p.done;
          break;
        case "take":
          if (event.node === id) return p.warn;
          break;
        case "sift":
          if (event.other === id) return p.focus;
          break;
      }
      return frame.focus === id ? p.focus : path.has(id) ? p.path : p.node;
    };

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
    this.drawSlots(input.slots ?? [], target, radius, column, gap);
    // A heap value starts at the end of the array, not the root: nothing to carry down.
    if (!input.array) this.drawCarried(frame, radius);
    if (input.array) this.drawArray(frame, highlighted);
    return busy;
  }

  /** Guess mode: every empty spot, dashed, with a line up to the node it would hang from. */
  private drawSlots(
    slots: Slot[],
    target: Map<number, { x: number; y: number }>,
    radius: number,
    column: number,
    gap: number,
  ) {
    const { ctx } = this;
    const p = this.palette;
    this.spots = [];
    const r = Math.max(10, radius * 0.72);
    for (const slot of slots) {
      const parent = target.get(slot.parent);
      if (!parent) continue;
      // Half a column over (where an in-order neighbor would sit), but never wider than a branch looks.
      const reach = Math.min(Math.max(column * 0.5, r * 1.1), Math.max(gap * 1.1, r * 2.4));
      const x = parent.x + (slot.side === "left" ? -1 : 1) * reach;
      const y = parent.y + gap;
      this.spots.push({ key: slot.key, x, y, r: r + 6 });
      ctx.strokeStyle = css(p.focus, 0.5);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(parent.x, parent.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = css(p.background);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = css(p.focus);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = css(p.focus);
      ctx.font = `700 ${Math.round(r * 0.9)}px "Instrument Sans", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", x, y + 1);
    }
  }

  /** The guess-mode spot under a point (canvas pixels), if any. */
  slotAt(x: number, y: number): string | null {
    let best: { key: string; d: number } | null = null;
    for (const s of this.spots) {
      const d = Math.hypot(s.x - x, s.y - y);
      if (d <= s.r && (!best || d < best.d)) best = { key: s.key, d };
    }
    return best?.key ?? null;
  }

  /** Heap: the array behind the tree, slot by slot, colored like the nodes. */
  private drawArray(frame: TreeFrame, highlighted: (id: number) => RGB) {
    const { ctx, width, height } = this;
    const p = this.palette;
    const n = frame.nodes.length;
    if (!n) return;
    const cell = Math.min(34, (width - 24) / n);
    const x0 = width / 2 - (cell * n) / 2;
    const y = height - ARRAY_HEIGHT + 6;
    const h = Math.min(30, cell);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    frame.nodes.forEach((node, i) => {
      const x = x0 + i * cell;
      const fill = highlighted(node.id);
      ctx.fillStyle = css(fill);
      ctx.beginPath();
      ctx.roundRect(x + 1, y, cell - 2, h, 5);
      ctx.fill();
      if (fill === p.node) {
        ctx.strokeStyle = css(p.ring);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (frame.focus === node.id) {
        ctx.strokeStyle = css(p.ink);
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = css(inkOn(fill, p));
      ctx.font = `600 ${Math.round(Math.min(13, cell * 0.42))}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.fillText(String(node.value), x + cell / 2, y + h / 2 + 1);
      // Slot numbers, sparser when they'd crowd.
      if (cell >= 18 || i % 2 === 0) {
        ctx.fillStyle = css(p.ring);
        ctx.font = `500 ${cell < 18 ? 8 : 10}px "JetBrains Mono", ui-monospace, monospace`;
        ctx.fillText(String(i), x + cell / 2, y + h + 10);
      }
    });
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
