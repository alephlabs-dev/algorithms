import type { Frame } from "./types";
import { smoothDamp } from "@/canvas/smoothDamp";
import { hexToRgb, readColors, type CanvasColors, type RGB } from "@/canvas/theme";
import { localized } from "@/i18n";

const PIVOT = localized({ en: "pivot", es: "pivote" });

export type DisplayMode = "bars" | "numbers";

export type RenderInput = {
  frame: Frame;
  /** Value of each item, by id. */
  values: readonly number[];
  mode: DisplayMode;
  /** Seconds a move should take. 0 snaps. */
  moveDuration: number;
  /** The run just finished; plays the verification sweep once. */
  celebrate: boolean;
  /** Changes when a new array is generated; bars are rebuilt instead of animated. */
  runId: number;
  /** Label compared bars with their values and the pivot by name, when bars are wide enough. */
  annotate?: boolean;
  /** Items labelled with their values whatever they're doing (guess mode's question names them). */
  labels?: readonly number[];
  /** Every bar shows its value (guess mode: a question is answered by comparing values). */
  labelAll?: boolean;
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
};

const MAX_AREA_WIDTH = 1200; // beyond this, bars for small arrays get uncomfortably wide
const BAR_MAX_HEIGHT = 0.8; // leaves room above the tallest bar for lifts and arcs
const LIFT = 0.06;
// Highlighted items outside the focus fade a little; plain ones switch to the dim color.
const DIMMED_ALPHA = 0.6;
// The finish: a line sweeps left to right, checking each bar and turning it
// green as it passes. Same length for 10 bars or 400.
const SWEEP_DURATION = 0.9;
const MIN_HOP_DURATION = 0.08; // below this, moves are too quick for an arc to read
// A value goes over its bar only if its text fits the bar's slot; a smaller size is tried before giving up.
const LABEL_SIZES = [12, 10];
const labelFont = (px: number) => `600 ${px}px "JetBrains Mono Variable", ui-monospace, monospace`;

// Relative luminance (WCAG), 0 for black to 1 for white. Gamma-corrected, unlike theme.ts's
// luminance, and the label thresholds are tuned to it: keep it separate.
const luminance = (rgb: RGB) => {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The theme's darkest and lightest colors, for text drawn on top of bars. */
const inkFor = (colors: CanvasColors) => {
  const pair = [colors.background, colors.foreground];
  const [dark, light] = luminance(hexToRgb(pair[0])) < luminance(hexToRgb(pair[1])) ? pair : [pair[1], pair[0]];
  return { dark, light };
};

const paletteFor = (colors: CanvasColors) => ({
  base: hexToRgb(colors.bar),
  active: hexToRgb(colors.secondary),
  temp: hexToRgb(colors.tertiary),
  done: hexToRgb(colors.primary),
  dim: hexToRgb(colors.dim),
});

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
  /** When the finishing sweep started (renderer clock), while it runs. */
  private sweepStart: number | null = null;
  /** Items that were already green when the sweep started; they stay green. */
  private doneBeforeSweep = new Set<number>();
  private colors = readColors();
  private palette = paletteFor(this.colors);

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    // Number tiles use a web font; draw again once it's ready instead of keeping the fallback.
    document.fonts?.ready.then(() => this.draw());
  }

  /** Picks up the theme's colors again; bars ease into them. */
  refreshColors() {
    this.colors = readColors();
    this.palette = paletteFor(this.colors);
    this.start();
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
        // Starts once the last moves (started just above) have landed.
        this.sweepStart = this.clock + input.moveDuration;
        this.doneBeforeSweep = new Set(previous.frame.done);
      }
      if (!input.celebrate) this.sweepStart = null;
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
        color: this.palette.base.map(spring) as ItemState["color"],
        grow: spring(reduce ? 1 : 0),
        growDelay: reduce ? 0 : position * stagger,
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

    // Where the finishing sweep is, in slots; bars to its right wait to turn green.
    let sweep = Infinity;
    if (this.sweepStart !== null) {
      const t = (this.clock - this.sweepStart) / SWEEP_DURATION;
      if (t < 1) {
        sweep = Math.max(0, t) * this.items.length;
        busy = true;
      } else this.sweepStart = null;
    }

    this.items.forEach((item, id) => {
      const progress =
        item.moveDuration > 0 ? clamp01((this.clock - item.moveStart) / item.moveDuration) : 1;
      const eased = easeInOutCubic(progress);
      item.x = item.fromX + (item.targetX - item.fromX) * eased;
      item.arc = item.hopHeight * easeArc(eased);
      if (progress < 1) busy = true;
      else item.hopHeight = 0;

      follow(item.lift, active.has(id) ? 1 : 0, fadeTime);
      // Items that already reached their place stay green even outside the focus.
      const dimmed = focus.size > 0 && !focus.has(id) && !done.has(id);
      const highlighted = active.has(id) || temp.has(id);
      follow(item.alpha, dimmed && highlighted ? DIMMED_ALPHA : 1, fadeTime);
      const color: RGB = active.has(id)
        ? this.palette.active
        : temp.has(id)
          ? this.palette.temp
          : done.has(id) && (item.x + 0.5 <= sweep || this.doneBeforeSweep.has(id))
            ? this.palette.done
            : dimmed
              ? this.palette.dim
              : this.palette.base;
      item.color.forEach((channel, c) => follow(channel, color[c], fadeTime));

      if (item.growDelay > 0) {
        item.growDelay -= dt;
        busy = true;
      } else {
        follow(item.grow, 1, 0.12);
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

  /** The finishing sweep's position in slots, or null when it isn't running. */
  private sweepPosition() {
    if (this.sweepStart === null) return null;
    const t = (this.clock - this.sweepStart) / SWEEP_DURATION;
    return t < 1 ? Math.max(0, t) * this.items.length : null;
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
    const { ctx, dpr, width, height, input, colors } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!input || this.items.length === 0 || width === 0 || height === 0) return;

    const { offsetX, slot, gap, barWidth } = this.layout();
    const isBars = input.mode === "bars";
    const tile = this.tileSize();
    const liftPx = isBars ? height * LIFT : tile * 0.6;
    const sweep = this.sweepPosition();
    // Bars hop a little as the line checks them, over a few slots behind it.
    const popSlots = Math.max(1.5, this.items.length * 0.04);
    const popHeight = isBars ? height * 0.03 : tile * 0.3;
    const radius = isBars ? Math.min(4, barWidth * 0.3) : Math.min(6, tile * 0.15);

    if (this.pivotLine.alpha.value > 0.01) {
      const y = height - this.pivotLine.y.value;
      ctx.save();
      ctx.globalAlpha = 0.6 * this.pivotLine.alpha.value;
      ctx.strokeStyle = colors.outline;
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

    const ink = inkFor(colors);
    const font = `600 ${Math.max(10, Math.round(tile * 0.38))}px "JetBrains Mono Variable", ui-monospace, monospace`;

    // Thin bars are snapped to device pixels; otherwise their fractional edges
    // blend into stripes (moiré) across the array.
    const snap = barWidth < 6 ? (v: number) => Math.round(v * dpr) / dpr : (v: number) => v;

    for (const { item, id } of drawOrder) {
      const left = snap(offsetX + item.x * slot + gap / 2);
      const x = left;
      const w = Math.max(snap(left + barWidth) - left, 1 / dpr);

      let pop = 0;
      if (sweep !== null) {
        const behind = sweep - (item.x + 0.5);
        if (behind > 0 && behind < popSlots) pop = popHeight * easeArc(behind / popSlots);
      }
      const offsetY = item.lift.value * liftPx + item.arc + pop;

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

      // A thin outline on compared items, so they don't depend on color alone.
      if (item.lift.value > 0.05 && w >= 4) {
        ctx.globalAlpha = 0.9 * item.lift.value * item.alpha.value;
        ctx.strokeStyle = colors.outline;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5, Math.max(0, radius - 0.75));
        ctx.stroke();
        ctx.globalAlpha = item.alpha.value * (isBars ? 1 : item.grow.value);
      }

      if (id === input.frame.pivot) {
        ctx.strokeStyle = colors.outline;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - 3, y - 3, w + 6, h + 6, radius + 2);
        ctx.stroke();
      }

      if (!isBars) {
        // Dark digits on light tiles and light digits on dark ones, whatever the theme.
        ctx.fillStyle = luminance([r, g, b]) > 0.4 ? ink.dark : ink.light;
        ctx.font = font;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(value), x + w / 2, y + tile / 2 + 1);
      }
    }
    ctx.globalAlpha = 1;

    if (sweep !== null) {
      // The checking line, with a soft fade so it reads as light, not a cursor.
      const x = offsetX + sweep * slot;
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(0.25, colors.primary);
      gradient.addColorStop(1, colors.primary);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, height);
      ctx.stroke();
    }

    if (input.annotate && isBars) this.drawLabels(slot, offsetX, gap, barWidth, liftPx);
  }

  /**
   * Values above the compared bars, and "pivot" above the pivot, like callouts on a figure.
   * With `labelAll`, every bar gets its value; the ones in play stay in the accent color.
   */
  private drawLabels(slot: number, offsetX: number, gap: number, barWidth: number, liftPx: number) {
    const { ctx, height, input, colors } = this;
    if (!input) return;
    const widest = String(Math.max(...input.values));
    const size = LABEL_SIZES.find((px) => {
      ctx.font = labelFont(px);
      return ctx.measureText(widest).width <= slot - 2;
    });
    if (size === undefined) return;
    ctx.font = labelFont(size);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const named = new Set(input.labels);
    this.items.forEach((item, id) => {
      const isPivot = id === input.frame.pivot;
      const lifted = isPivot ? Math.max(item.lift.value, this.pivotLine.alpha.value) : item.lift.value;
      const inPlay = named.has(id) || lifted >= 0.05;
      const strength = named.has(id) ? 1 : input.labelAll ? Math.max(lifted, 0.75) : lifted;
      if (strength < 0.05) return;
      const value = input.values[id];
      const top = height - this.barHeight(value) * item.grow.value - item.lift.value * liftPx - item.arc;
      const x = offsetX + item.x * slot + gap / 2 + barWidth / 2;
      ctx.globalAlpha = strength * item.alpha.value;
      ctx.fillStyle = isPivot ? colors.foreground : inPlay ? colors.secondary : colors.muted;
      ctx.fillText(String(value), x, top - 8);
      if (isPivot) {
        // Wider than its bar: kept inside the canvas when the pivot is at either end.
        const half = ctx.measureText(PIVOT).width / 2;
        ctx.fillStyle = colors.muted;
        ctx.fillText(PIVOT, Math.min(Math.max(x, half), this.width - half), top - 24);
      }
    });
    ctx.globalAlpha = 1;
  }
}
