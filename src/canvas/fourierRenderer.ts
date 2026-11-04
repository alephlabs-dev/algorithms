import { FRAMES_PER_TURN, isWave, waveAt, type FourierRun, type Point, type Wave } from "@/fourier";
import { hexToRgb, readColors, type CanvasColors, type RGB } from "./theme";

export type FourierRenderInput = {
  run: FourierRun;
  frameIndex: number;
  /** Waiting for a hand-drawn shape: show only the stroke so far, in canvas pixels. */
  stroke: Point[] | null;
};

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const css = (c: RGB, alpha = 1) => `rgb(${c[0] | 0} ${c[1] | 0} ${c[2] | 0} / ${alpha})`;

/** Where a run's math lands on the canvas: an origin and how many pixels a unit is. */
/**
 * Where a run's math lands on the canvas: an origin, how many pixels a unit
 * is, and for waves the strip the wave is drawn in. On tall stages a wave
 * turns upright: circles on top, the wave running down from them.
 */
type Frame = { ox: number; oy: number; unit: number; upright: boolean; stripStart: number; stripEnd: number };

/**
 * Draws a Fourier run: the circles chained tip to tip with their radii, the
 * path the last tip has traced, and the goal faintly behind it. Waves trace
 * a strip to the right that scrolls as time goes on; drawings trace in place.
 * Nothing eases between frames: each frame is the series at that angle.
 */
export class FourierRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private input: FourierRenderInput | null = null;
  private palette = this.paletteFor(readColors());

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
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
    this.draw();
  }

  update(input: FourierRenderInput) {
    this.input = input;
    this.draw();
  }

  private paletteFor(colors: CanvasColors) {
    const background = hexToRgb(colors.background);
    const foreground = hexToRgb(colors.foreground);
    const muted = hexToRgb(colors.muted);
    return {
      circle: mix(background, muted, 0.45),
      radius: mix(background, foreground, 0.6),
      goal: mix(background, muted, 0.6),
      axis: mix(background, muted, 0.3),
      trace: hexToRgb(colors.secondary),
      tip: hexToRgb(colors.primary),
      ink: foreground,
    };
  }

  /** Waves: circles on the left, the wave strip to their right. Drawings: centered, filling the stage. */
  private layout(run: FourierRun): Frame {
    const { width: w, height: h } = this;
    if (isWave(run.algorithm)) {
      const reach = Math.max(
        1,
        run.terms.reduce((sum, t) => sum + t.amp, 0),
      );
      if (h > w * 1.15) {
        const unit = Math.min(w * 0.42, h * 0.2) / reach;
        const oy = 16 + unit * reach;
        return { ox: w / 2, oy, unit, upright: true, stripStart: oy + unit * reach + 24, stripEnd: h - 12 };
      }
      const unit = Math.min(h * 0.4, w * 0.2) / reach;
      const ox = 16 + unit * reach;
      return { ox, oy: h / 2, unit, upright: false, stripStart: ox + unit * reach + 24, stripEnd: w - 12 };
    }
    // Drawings are normalized to reach 1; leave room for the biggest circles swinging past.
    const unit = Math.min(w, h) * 0.4;
    return { ox: w / 2, oy: h / 2, unit, upright: false, stripStart: 0, stripEnd: 0 };
  }

  private draw() {
    const { ctx, dpr, width, height, input } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!input || width === 0 || height === 0) return;
    const { run, frameIndex, stroke } = input;
    if (stroke) {
      this.drawStroke(stroke);
      return;
    }
    const p = this.palette;
    const f = this.layout(run);
    const wave = isWave(run.algorithm);
    // A wave's height goes up, like on paper (or right, when it's upright: the picture turned a quarter
    // clockwise); drawings are kept in screen terms, y going down.
    const at = (pt: Point): [number, number] =>
      !wave
        ? [f.ox + pt.x * f.unit, f.oy + pt.y * f.unit]
        : f.upright
          ? [f.ox + pt.y * f.unit, f.oy + pt.x * f.unit]
          : [f.ox + pt.x * f.unit, f.oy - pt.y * f.unit];
    const index = Math.min(Math.max(frameIndex, 0), run.length - 1);
    const frame = run.frameAt(index);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (wave) this.drawWave(f, index);
    else this.drawGoalAndTrace(at, index);

    // The circles, biggest first, and the radius of each from its center to the next.
    const chain = frame.chain;
    for (let k = 0; k < run.terms.length; k++) {
      const [cx, cy] = at(chain[k]);
      const r = run.terms[k].amp * f.unit;
      if (r < 0.6) break; // the rest are too small to see
      ctx.strokeStyle = css(p.circle, 0.9);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      const [nx, ny] = at(chain[k + 1]);
      ctx.strokeStyle = css(p.radius, 0.85);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.stroke();
    }

    const [tx, ty] = at(chain[chain.length - 1]);
    if (wave) {
      // The tip's height carried across to where the wave is being drawn.
      ctx.strokeStyle = css(p.goal, 0.8);
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      const [sx, sy] = f.upright ? [tx, f.stripStart] : [f.stripStart, ty];
      ctx.moveTo(tx, ty);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = css(p.trace);
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = css(p.tip);
    ctx.beginPath();
    ctx.arc(tx, ty, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawStroke(stroke: Point[]) {
    const { ctx } = this;
    if (stroke.length < 2) return;
    ctx.strokeStyle = css(this.palette.trace);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (const point of stroke) ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  /** The wave strip: the goal wave faint and dashed, and what the circles have traced over the last turn. */
  private drawWave(f: Frame, index: number) {
    const { ctx, input } = this;
    const run = input!.run;
    const p = this.palette;
    const span = f.stripEnd - f.stripStart;
    if (span < 20) return;
    const now = run.thetaAt(index);
    const perRadian = span / (2 * Math.PI);
    // A point of the wave: time runs along the strip (newest at its start), the value across it.
    const point = (theta: number, value: number): [number, number] => {
      const along = f.stripStart + (now - theta) * perRadian;
      return f.upright ? [f.ox + value * f.unit, along] : [along, f.oy - value * f.unit];
    };

    ctx.strokeStyle = css(p.axis);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(...(f.upright ? ([f.ox, f.stripStart] as const) : ([f.stripStart, f.oy] as const)));
    ctx.lineTo(...(f.upright ? ([f.ox, f.stripEnd] as const) : ([f.stripEnd, f.oy] as const)));
    ctx.stroke();

    // The goal, over the whole strip (one turn back from now).
    ctx.strokeStyle = css(p.goal, 0.7);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    for (let i = 0; i <= FRAMES_PER_TURN; i++) {
      const theta = now - (i / FRAMES_PER_TURN) * 2 * Math.PI;
      const [px, py] = point(theta, waveAt(run.algorithm as Wave, theta));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // What's been traced, newest at the strip's start.
    const from = Math.max(0, index - FRAMES_PER_TURN);
    if (index > from) {
      ctx.strokeStyle = css(p.trace);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = from; i <= index; i++) {
        const [px, py] = point(run.thetaAt(i), run.tips[i].y);
        if (i === from) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  /** Drawings: the goal shape faint and dashed, and the tip's path so far over it. */
  private drawGoalAndTrace(at: (pt: Point) => [number, number], index: number) {
    const { ctx, input } = this;
    const run = input!.run;
    const p = this.palette;
    ctx.strokeStyle = css(p.goal, 0.7);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    run.target.forEach((pt, k) => {
      const [px, py] = at(pt);
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    if (index >= 1) {
      ctx.strokeStyle = css(p.trace);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= index; i++) {
        const [px, py] = at(run.tips[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // A constellation's stars sit on top: a bright point with a soft halo.
    for (const star of run.stars) {
      const [sx, sy] = at(star);
      ctx.fillStyle = css(p.ink, 0.18);
      ctx.beginPath();
      ctx.arc(sx, sy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = css(p.ink);
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
