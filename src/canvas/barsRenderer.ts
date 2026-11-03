import type { Frame } from "@/algorithms";
import { smoothDamp } from "./smoothDamp";
import { colors, hexToRgb, type RGB } from "./theme";

export type DisplayMode = "bars" | "numbers";

export type RenderInput = {
  frame: Frame;
  /** Value of each item, by id. */
  values: readonly number[];
  mode: DisplayMode;
  /** Seconds a move should take. 0 snaps. */
  moveDuration: number;
  /** The run just finished; plays the victory wave once. */
  celebrate: boolean;
  /** Changes when a new array is generated; bars are rebuilt instead of animated. */
  runId: number;
};

type Spring = { value: number; velocity: number };
const spring = (value: number): Spring => ({ value, velocity: 0 });

type ItemState = {
  /** Horizontal position, in slots (0 = first position). */
  x: number;
  /** The current move: from `fromX` to `targetX`, starting at `moveStart` (renderer clock). */
  fromX: number;
  targetX: number;
  moveStart: number;
  moveDuration: number;
  /** Arc height in px for the current move; 0 for a straight slide. */
  hopHeight: number;
  /** Current arc offset in px, derived from the move's progress. */
  arc: number;
  lift: Spring;
  alpha: Spring;
  color: [Spring, Spring, Spring];
  /** 0 → 1 when a new array appears. */
  grow: Spring;
  growDelay: number;
  /** When this item's victory hop starts (renderer clock, seconds). */
  waveStart: number | null;
};

const MAX_AREA_WIDTH = 896; // matches the old max-w-4xl layout
const BAR_MAX_HEIGHT = 0.8; // leaves room above the tallest bar for lifts and arcs
const LIFT = 0.06;
const DIMMED_ALPHA = 0.4;
const WAVE_DURATION = 0.4;
const MIN_HOP_DURATION = 0.08; // below this, moves are too quick for an arc to read

const palette = {
  base: hexToRgb(colors.foreground),
  active: hexToRgb(colors.secondary),
  temp: hexToRgb(colors.tertiary),
  done: hexToRgb(colors.primary),
};

const clamp01 = (p: number) => Math.min(Math.max(p, 0), 1);
const easeArc = (p: number) => Math.sin(Math.PI * clamp01(p));
// Symmetric ease-in-out: moves start and stop gently, like a hand moving a card.
const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

/**
 * Draws the array on a canvas and animates between frames. React hands it
 * frames through `update`; it runs its own animation loop only while
 * something is moving, and goes idle otherwise.
 */
export class BarsRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private width = 0;
  private height = 0;
  private dpr = 1;
  private input: RenderInput | null = null;
  private items: ItemState[] = [];
  private maxValue = 1;
  private pivotLine = { y: spring(0), alpha: spring(0) };
  private clock = 0;
  private lastTick = 0;
  private frameRequest = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
  }

  destroy() {
    cancelAnimationFrame(this.frameRequest);
    this.frameRequest = 0;
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.draw();
  }

  update(input: RenderInput) {
    const previous = this.input;
    this.input = input;
    const reduce = this.reducedMotion.matches;
    const { order, hop } = input.frame;

    if (!previous || previous.runId !== input.runId || this.items.length !== order.length) {
      this.reset(input, reduce);
    } else {
      const canHop = !reduce && input.moveDuration >= MIN_HOP_DURATION;
      order.forEach((id, position) => {
        const item = this.items[id];
        if (item.targetX === position) return;
        // Start from wherever the item is now, so interrupted moves stay continuous.
        item.fromX = item.x;
        item.targetX = position;
        item.moveStart = this.clock;
        item.moveDuration = reduce ? 0 : input.moveDuration;
        item.hopHeight = canHop && id === hop ? this.hopHeightFor(Math.abs(position - item.fromX)) : 0;
      });

      if (input.celebrate && !previous.celebrate && !reduce) {
        const stagger = Math.min(0.025, 0.8 / order.length);
        order.forEach((id, position) => {
          this.items[id].waveStart = this.clock + position * stagger;
        });
      }
    }

    this.start();
  }

  private reset(input: RenderInput, reduce: boolean) {
    const { order } = input.frame;
    this.maxValue = Math.max(1, ...input.values);
    // Bars grow in left to right, over at most ~0.3s in total.
    const stagger = Math.min(0.012, 0.3 / Math.max(order.length, 1));
    this.items = new Array(order.length);
    order.forEach((id, position) => {
      this.items[id] = {
        x: position,
        fromX: position,
        targetX: position,
        moveStart: 0,
        moveDuration: 0,
        hopHeight: 0,
        arc: 0,
        lift: spring(0),
        alpha: spring(1),
        color: palette.base.map(spring) as ItemState["color"],
        grow: spring(reduce ? 1 : 0),
        growDelay: reduce ? 0 : position * stagger,
        waveStart: null,
      };
    });
  }

  private hopHeightFor(distance: number) {
    if (this.input?.mode === "numbers") return this.tileSize() * 0.9;
    return this.height * (0.06 + 0.02 * Math.min(distance, 3));
  }

  private start() {
    if (this.frameRequest) return;
    this.lastTick = performance.now();
    this.frameRequest = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    const dt = Math.min(0.05, (now - this.lastTick) / 1000);
    this.lastTick = now;
    this.clock += dt;
    const busy = this.step(dt);
    this.draw();
    this.frameRequest = busy ? requestAnimationFrame(this.tick) : 0;
  };

  /** Advances every animation by `dt` seconds. Returns whether anything is still moving. */
  private step(dt: number) {
    const input = this.input;
    if (!input) return false;
    const reduce = this.reducedMotion.matches;
    const { frame } = input;
    const active = new Set(frame.active);
    const temp = new Set(frame.temp);
    const done = new Set(frame.done);
    const focus = new Set(frame.focus);

    // Highlights ease with a spring; moves follow a fixed-duration curve (below).
    const fadeTime = reduce ? 0 : Math.min(0.12, Math.max(0.03, input.moveDuration / 3));
    let busy = false;
    const follow = (s: Spring, target: number, time: number) => {
      s.value = smoothDamp(s.value, target, s, time, dt);
      if (Math.abs(s.value - target) > 0.001 || Math.abs(s.velocity) > 0.001) busy = true;
      else {
        s.value = target;
        s.velocity = 0;
      }
    };

    this.items.forEach((item, id) => {
      const progress =
        item.moveDuration > 0 ? clamp01((this.clock - item.moveStart) / item.moveDuration) : 1;
      const eased = easeInOutCubic(progress);
      item.x = item.fromX + (item.targetX - item.fromX) * eased;
      item.arc = item.hopHeight * easeArc(eased);
      if (progress < 1) busy = true;
      else item.hopHeight = 0;

      follow(item.lift, active.has(id) ? 1 : 0, fadeTime);
      follow(item.alpha, focus.size > 0 && !focus.has(id) ? DIMMED_ALPHA : 1, fadeTime);
      const color: RGB = active.has(id)
        ? palette.active
        : temp.has(id)
          ? palette.temp
          : done.has(id)
            ? palette.done
            : palette.base;
      item.color.forEach((channel, c) => follow(channel, color[c], fadeTime));

      if (item.growDelay > 0) {
        item.growDelay -= dt;
        busy = true;
      } else {
        follow(item.grow, 1, 0.12);
      }

      if (item.waveStart !== null) {
        if (this.clock - item.waveStart < WAVE_DURATION) busy = true;
        else item.waveStart = null;
      }
    });

    const pivotVisible = frame.pivot !== null && input.mode === "bars";
    if (frame.pivot !== null) {
      const target = this.barHeight(input.values[frame.pivot]);
      // Jump straight to the first pivot instead of sweeping up from the bottom.
      if (this.pivotLine.alpha.value < 0.01) this.pivotLine.y.value = target;
      follow(this.pivotLine.y, target, fadeTime * 1.5);
    }
    follow(this.pivotLine.alpha, pivotVisible ? 1 : 0, fadeTime);

    return busy;
  }

  private barHeight(value: number) {
    return (value / this.maxValue) * this.height * BAR_MAX_HEIGHT;
  }

  private layout() {
    const n = Math.max(this.items.length, 1);
    const areaWidth = Math.min(this.width, MAX_AREA_WIDTH);
    const offsetX = (this.width - areaWidth) / 2;
    const slot = areaWidth / n;
    // Gaps shrink as bars get thinner, and disappear once they'd be under ~1px.
    const gap = n <= 50 ? Math.min(12, slot * 0.25) : slot >= 6 ? slot * 0.15 : 0;
    return { offsetX, slot, gap, barWidth: slot - gap };
  }

  private tileSize() {
    const { barWidth } = this.layout();
    return Math.min(barWidth, this.height * 0.22, 72);
  }

  private draw() {
    const { ctx, dpr, width, height, input } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!input || this.items.length === 0 || width === 0 || height === 0) return;

    const { offsetX, slot, gap, barWidth } = this.layout();
    const isBars = input.mode === "bars";
    const tile = this.tileSize();
    const liftPx = isBars ? height * LIFT : tile * 0.6;
    const waveHeight = isBars ? height * 0.05 : tile * 0.4;
    const radius = isBars ? Math.min(4, barWidth * 0.3) : Math.min(6, tile * 0.15);

    if (this.pivotLine.alpha.value > 0.01) {
      const y = height - this.pivotLine.y.value;
      ctx.save();
      ctx.globalAlpha = 0.6 * this.pivotLine.alpha.value;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(offsetX, Math.round(y) + 0.5);
      ctx.lineTo(offsetX + slot * this.items.length, Math.round(y) + 0.5);
      ctx.stroke();
      ctx.restore();
    }

    // Draw hopping items last so they pass over their neighbours.
    const drawOrder = this.items
      .map((item, id) => ({ item, id }))
      .sort((a, b) => Number(a.item.arc > 0) - Number(b.item.arc > 0));

    const font = `600 ${Math.max(10, Math.round(tile * 0.38))}px ui-sans-serif, system-ui, sans-serif`;

    // Thin bars are snapped to device pixels; otherwise their fractional edges
    // blend into stripes (moiré) across the array.
    const snap = barWidth < 6 ? (v: number) => Math.round(v * dpr) / dpr : (v: number) => v;

    for (const { item, id } of drawOrder) {
      const left = snap(offsetX + item.x * slot + gap / 2);
      const x = left;
      const w = Math.max(snap(left + barWidth) - left, 1 / dpr);

      let wave = 0;
      if (item.waveStart !== null) {
        const t = (this.clock - item.waveStart) / WAVE_DURATION;
        if (t > 0 && t < 1) wave = waveHeight * easeArc(t);
      }
      const offsetY = item.lift.value * liftPx + item.arc + wave;

      const value = input.values[id];
      const h = isBars ? this.barHeight(value) * item.grow.value : tile;
      const y = isBars ? height - h - offsetY : (height - tile) / 2 - offsetY;
      const [r, g, b] = item.color.map((c) => Math.round(c.value));

      ctx.globalAlpha = item.alpha.value * (isBars ? 1 : item.grow.value);
      ctx.fillStyle = `rgb(${r} ${g} ${b})`;
      ctx.beginPath();
      if (w >= 3) ctx.roundRect(x, y, w, h, radius);
      else ctx.rect(x, y, w, h);
      ctx.fill();

      if (id === input.frame.pivot) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - 3, y - 3, w + 6, h + 6, radius + 2);
        ctx.stroke();
      }

      if (!isBars) {
        // Dark text on light tiles (base, yellow), white on dark ones (purple, green).
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        ctx.fillStyle = luminance > 165 ? colors.background : "#ffffff";
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(value), x + w / 2, y + tile / 2 + 1);
      }
    }
    ctx.globalAlpha = 1;
  }
}
