import type { HashFrame, Operation } from "./types";
import { drawOpsQueue, QUEUE_HEIGHT } from "./paint";
import { css, inkOn, readColors, structurePalette, type RGB } from "@/canvas/theme";
import { localized } from "@/i18n";

const FULL = localized({
  en: (v: number) => `Full: no free slot for ${v}`,
  es: (v) => `Llena: no hay casilla libre para ${v}`,
});


export type HashRenderInput = {
  frame: HashFrame;
  /** Chaining draws rows of linked lists; linear probing a grid of slots. */
  chaining: boolean;
  /** Every operation in the run; the frame's opIndex says which one is under way. */
  ops: Operation[];
  /** Changes when the values are replaced wholesale. */
  structureId: number;
  /** Seconds a new value takes to grow in. 0 snaps. */
  fade: number;
};

const MONO = `"JetBrains Mono", ui-monospace, monospace`;
/** Room under a slot for its number. */
const LABEL = 16;

/**
 * Draws a hash table. Chaining: one row per bucket, its values linked left to
 * right. Linear probing: the slots in a grid, read left to right, top to
 * bottom, with deleted values left as markers. The value being hashed sits by
 * the bucket or slot it's looking at.
 */
export class HashRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private width = 0;
  private height = 0;
  private dpr = 1;
  private input: HashRenderInput | null = null;
  private palette = structurePalette(readColors());
  /** How grown-in each value is, by id: new ones start small. */
  private scale = new Map<number, number>();
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
    this.update(this.input);
  }

  update(input: HashRenderInput | null) {
    const previous = this.input;
    this.input = input;
    if (!input) return;
    if (!previous || previous.structureId !== input.structureId || previous.chaining !== input.chaining) {
      this.scale.clear();
      for (const bucket of input.frame.buckets) for (const item of bucket) this.scale.set(item.id, 1);
    }
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

  /** Grows new values in; returns whether any still are. */
  private grow(frame: HashFrame, dt: number, snap: boolean, fade: number) {
    let busy = false;
    const present = new Set<number>();
    for (const bucket of frame.buckets) {
      for (const item of bucket) {
        present.add(item.id);
        const at = this.scale.get(item.id);
        if (at === undefined) {
          this.scale.set(item.id, snap ? 1 : 0.4);
          busy = busy || !snap;
        } else if (at < 1) {
          const next = snap ? 1 : at + (1 - at) * (1 - Math.exp(-dt / Math.max(0.03, fade / 3)));
          this.scale.set(item.id, next > 0.99 ? 1 : next);
          busy = busy || next <= 0.99;
        }
      }
    }
    for (const id of [...this.scale.keys()]) if (!present.has(id)) this.scale.delete(id);
    return busy;
  }

  private draw(dt = 0): boolean {
    const { ctx, dpr, width, height, input } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!input || width === 0 || height === 0) return false;
    const { frame } = input;
    const busy = this.grow(frame, dt, this.reducedMotion.matches || input.fade === 0, input.fade);
    const showQueue = input.ops.length > 1;
    if (showQueue) drawOpsQueue(ctx, this.palette, width, input.ops, frame.opIndex);
    const top = showQueue ? QUEUE_HEIGHT : 12;
    if (input.chaining) this.drawChains(frame, top);
    else this.drawSlots(frame, top);
    return busy;
  }

  /** The value being hashed or looked for, in the frame's event, if any. */
  private carried(frame: HashFrame): number | null {
    const e = frame.event;
    return e.type === "hash" || e.type === "probe" ? e.value : null;
  }

  /** Fill for a value: placed or found is the accent, the one being looked at the focus color. */
  private fillFor(frame: HashFrame, id: number): RGB {
    const p = this.palette;
    const e = frame.event;
    if ((e.type === "place" || e.type === "found") && e.item === id) return p.done;
    if (e.type === "duplicate" && e.item === id) return p.warn;
    if (e.type === "probe" && e.item === id) return e.match ? p.done : p.focus;
    return p.node;
  }

  private bubble(x: number, y: number, r: number, value: number) {
    const { ctx } = this;
    const p = this.palette;
    ctx.fillStyle = css(p.focus);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = css(p.background);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = css(inkOn(p.focus, p));
    ctx.font = `600 ${Math.round(r * 0.9)}px ${MONO}`;
    ctx.fillText(String(value), x, y + 1);
  }

  private circle(x: number, y: number, r: number, fill: RGB, value: number, ringed: boolean) {
    const { ctx } = this;
    const p = this.palette;
    ctx.fillStyle = css(fill);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (fill === p.node) {
      ctx.strokeStyle = css(p.ring);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (ringed) {
      ctx.strokeStyle = css(p.ink);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, r + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = css(inkOn(fill, p));
    ctx.font = `600 ${Math.round(r * 0.85)}px ${MONO}`;
    ctx.fillText(String(value), x, y + 1);
  }

  /** Chaining: a row per bucket, the bucket's number boxed on the left and its values linked after it. */
  private drawChains(frame: HashFrame, top: number) {
    const { ctx, width, height } = this;
    const p = this.palette;
    const m = frame.buckets.length;
    const rowH = Math.min(56, (height - top - 12) / m);
    const r = Math.max(9, Math.min(17, rowH * 0.34));
    const gutter = r * 2 + 12; // where the value being hashed waits
    const box = Math.max(26, r * 2 + 4);
    const x0 = 12 + gutter;
    const longest = Math.max(1, ...frame.buckets.map((b) => b.length));
    const step = Math.min(r * 2 + 18, (width - x0 - box - 16 - r) / longest);
    const y0 = top + (height - top - 12 - rowH * m) / 2 + rowH / 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const carried = this.carried(frame);
    frame.buckets.forEach((bucket, b) => {
      const y = y0 + b * rowH;
      const looked = frame.probed.includes(b);
      // Row wash for the bucket the operation went to.
      if (looked) {
        ctx.fillStyle = css(p.path, 0.35);
        ctx.beginPath();
        ctx.roundRect(x0 - 4, y - rowH / 2 + 2, width - x0 - 8, rowH - 4, 8);
        ctx.fill();
      }
      const focusBucket = frame.focus?.bucket === b;
      ctx.fillStyle = css(focusBucket && frame.event.type === "hash" ? p.focus : p.node);
      ctx.beginPath();
      ctx.roundRect(x0, y - box / 2, box, box, 6);
      ctx.fill();
      ctx.strokeStyle = css(p.ring);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = css(focusBucket && frame.event.type === "hash" ? inkOn(p.focus, p) : p.ink, 0.8);
      ctx.font = `600 ${Math.round(box * 0.42)}px ${MONO}`;
      ctx.fillText(String(b), x0 + box / 2, y + 1);
      // Links, then values.
      const xs = bucket.map((_, k) => x0 + box + 10 + r + k * step);
      ctx.strokeStyle = css(p.edge);
      ctx.lineWidth = 2;
      if (bucket.length) {
        ctx.beginPath();
        ctx.moveTo(x0 + box, y);
        ctx.lineTo(xs[xs.length - 1], y);
        ctx.stroke();
      }
      bucket.forEach((item, k) => {
        const s = this.scale.get(item.id) ?? 1;
        this.circle(xs[k], y, r * s, this.fillFor(frame, item.id), item.value, frame.focus?.item === item.id);
      });
      if (carried !== null && focusBucket) this.bubble(12 + gutter / 2 - 4, y, r * 0.85, carried);
    });
  }

  /** Linear probing: the slots in a grid, numbered, with markers where values were deleted. */
  private drawSlots(frame: HashFrame, top: number) {
    const { ctx, width, height } = this;
    const p = this.palette;
    const m = frame.buckets.length;
    const pad = 12;
    // However many rows makes the slots biggest, spread evenly across them.
    const sizeFor = (rows: number) => {
      const cols = Math.ceil(m / rows);
      return Math.min(54, (width - 2 * pad) / cols, ((height - top - 12) / rows - LABEL) / 1.25);
    };
    let rows = 1;
    for (let r = 2; r <= 6; r++) if (sizeFor(r) > sizeFor(rows) + 0.5) rows = r;
    const cols = Math.ceil(m / rows);
    const cell = sizeFor(rows);
    // Each row: room above for the value being looked for, the slot, its number under it.
    const rowH = cell * 1.25 + LABEL;
    const x0 = width / 2 - (cols * cell) / 2;
    const y0 = top + Math.max(0, (height - top - rows * rowH) / 2) + cell * 0.25;
    const e = frame.event;
    const carried = this.carried(frame);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < m; i++) {
      const x = x0 + (i % cols) * cell;
      const y = y0 + Math.floor(i / cols) * rowH;
      const item = frame.buckets[i][0];
      const looked = frame.probed.includes(i);
      const isFocus = frame.focus?.bucket === i;
      let fill: RGB = looked ? p.path : p.node;
      if (item && !item.deleted) {
        const f = this.fillFor(frame, item.id);
        if (f !== p.node) fill = f;
      }
      if (e.type === "hash" && e.bucket === i) fill = p.focus;
      if (e.type === "full") fill = p.node;
      const s = item ? (this.scale.get(item.id) ?? 1) : 1;
      const inset = 2 + (1 - s) * cell * 0.3;
      ctx.fillStyle = css(fill, item || looked || isFocus ? 1 : 0.55);
      ctx.beginPath();
      ctx.roundRect(x + inset, y + inset, cell - 2 * inset, cell - 2 * inset, 7);
      ctx.fill();
      ctx.strokeStyle = css(isFocus ? p.ink : p.ring);
      ctx.lineWidth = isFocus ? 2.5 : 1;
      if (item?.deleted) ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      if (item) {
        ctx.fillStyle = css(inkOn(fill, p), item.deleted ? 0.4 : 1);
        ctx.font = `600 ${Math.round(cell * 0.34)}px ${MONO}`;
        ctx.fillText(item.deleted ? "×" : String(item.value), x + cell / 2, y + cell / 2 + 1);
      }
      ctx.fillStyle = css(p.ring);
      ctx.font = `500 ${Math.round(Math.min(11, cell * 0.24))}px ${MONO}`;
      ctx.fillText(String(i), x + cell / 2, y + cell + 9);
      if (carried !== null && isFocus) this.bubble(x + cell / 2, y - cell * 0.32, Math.min(14, cell * 0.3), carried);
    }
    if (e.type === "full") {
      ctx.fillStyle = css(p.warn);
      ctx.font = `600 14px "Instrument Sans", system-ui, sans-serif`;
      ctx.fillText(FULL(e.value), width / 2, top + 4);
    }
  }
}
