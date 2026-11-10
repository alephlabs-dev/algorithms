import { readColors, type CanvasColors, type RGB } from "./theme";

/**
 * A color a cell can take. Dotted tones get a few dark dots and crossed ones an ×, so they
 * read without relying on color alone.
 */
export type GridTone = { rgb: RGB; dots?: boolean; cross?: boolean };

/** A module's tones in the current theme. Cells name a tone by its index. */
export type GridPalette = (colors: CanvasColors) => GridTone[];

/** What each cell of the grid shows. Cells are numbered row by row: cell = row * cols + col. */
export type GridCells = {
  rows: number;
  cols: number;
  /** Per cell, its tone in the palette. */
  tones: ArrayLike<number>;
  /** Per cell, a number that grows as the cell moves along. A cell whose rank goes up pops in. */
  ranks: ArrayLike<number>;
  /** The cell being looked at, outlined. */
  current?: number | null;
  /** A filled dot on this cell. */
  start?: number;
  /** A target of two rings on this cell. */
  end?: number;
};

export type GridRenderInput = GridCells & {
  /** Changes when the grid is replaced wholesale; cells snap instead of animating. */
  gridId: number;
  /** Seconds a color change takes. 0 snaps (scrubbing, very fast playback). */
  fade: number;
  /** Cells guess mode asks about, each with its letter, drawn on top of everything. */
  marks?: GridMark[];
};

/** A cell guess mode marks on the grid, and the letter it shows. */
export type GridMark = { cell: number; label: string };

/** Guess mode's letters are never drawn smaller than this, in CSS pixels. */
const MARK_MIN_FONT = 11;

const GAP = 0.08; // share of a cell left as a gap between cells
const POP_FROM = 0.45; // a cell whose rank goes up grows from this scale

/**
 * Draws a grid of cells on a canvas and animates changes: cells fade between
 * tones and pop in when their rank goes up (in pathfinding, when they join the
 * frontier, get visited or become part of the path). Knows nothing about what
 * the tones mean: each module brings its palette and says which tone each cell
 * shows. Runs its own loop only while something is moving.
 */
export class GridRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private width = 0;
  private height = 0;
  private dpr = 1;
  private input: GridRenderInput | null = null;
  private colors = readColors();
  private tones: GridTone[];
  // Per cell: current color, the rank it last showed, and a pop spring.
  private rgb = new Float32Array(0);
  private shown = new Int16Array(0);
  private scale = new Float32Array(0);
  private scaleVelocity = new Float32Array(0);
  private lastTick = 0;
  private frameRequest = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly palette: GridPalette,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.tones = palette(this.colors);
    // Guess mode's letters use a web font; draw again once it's ready instead of keeping the fallback.
    document.fonts?.ready.then(() => this.draw());
  }

  destroy() {
    cancelAnimationFrame(this.frameRequest);
    this.frameRequest = 0;
  }

  refreshColors() {
    this.colors = readColors();
    this.tones = this.palette(this.colors);
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

  update(input: GridRenderInput) {
    const previous = this.input;
    this.input = input;
    const count = input.rows * input.cols;
    const fresh = !previous || previous.gridId !== input.gridId || this.rgb.length !== count * 3;
    if (fresh) {
      this.rgb = new Float32Array(count * 3);
      this.shown = new Int16Array(count).fill(-1);
      this.scale = new Float32Array(count).fill(1);
      this.scaleVelocity = new Float32Array(count);
      for (let cell = 0; cell < count; cell++) {
        this.rgb.set(this.targetColor(cell), cell * 3);
        this.shown[cell] = input.ranks[cell];
      }
    } else if (!this.reducedMotion.matches && input.fade > 0) {
      // Cells moving along pop in; cells going back (stepping backwards) just fade.
      for (let cell = 0; cell < count; cell++) {
        const rank = input.ranks[cell];
        if (rank > this.shown[cell]) this.scale[cell] = POP_FROM;
        this.shown[cell] = rank;
      }
    } else {
      for (let cell = 0; cell < count; cell++) this.shown[cell] = input.ranks[cell];
    }
    this.start();
  }

  /** The grid cell at a point on the canvas (CSS pixels), or null outside the grid. */
  cellAt(x: number, y: number): number | null {
    const input = this.input;
    if (!input) return null;
    const { size, left, top } = this.layout();
    const col = Math.floor((x - left) / size);
    const row = Math.floor((y - top) / size);
    if (row < 0 || col < 0 || row >= input.rows || col >= input.cols) return null;
    return row * input.cols + col;
  }

  private targetColor(cell: number): RGB {
    return this.tones[this.input!.tones[cell]].rgb;
  }

  private layout() {
    const { rows, cols } = this.input!;
    const size = Math.max(4, Math.floor(Math.min(this.width / cols, this.height / rows)));
    return { size, left: Math.floor((this.width - size * cols) / 2), top: Math.floor((this.height - size * rows) / 2) };
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
    const count = input.rows * input.cols;
    for (let cell = 0; cell < count; cell++) {
      const target = this.targetColor(cell);
      for (let c = 0; c < 3; c++) {
        const i = cell * 3 + c;
        const diff = target[c] - this.rgb[i];
        if (Math.abs(diff) < 0.5) this.rgb[i] = target[c];
        else {
          this.rgb[i] += diff * blend;
          busy = true;
        }
      }
      // An underdamped spring, so pops overshoot a touch and settle.
      if (this.scale[cell] !== 1 || this.scaleVelocity[cell] !== 0) {
        if (snap) {
          this.scale[cell] = 1;
          this.scaleVelocity[cell] = 0;
          continue;
        }
        const accel = 260 * (1 - this.scale[cell]) - 22 * this.scaleVelocity[cell];
        this.scaleVelocity[cell] += accel * dt;
        this.scale[cell] += this.scaleVelocity[cell] * dt;
        if (Math.abs(1 - this.scale[cell]) < 0.002 && Math.abs(this.scaleVelocity[cell]) < 0.01) {
          this.scale[cell] = 1;
          this.scaleVelocity[cell] = 0;
        } else busy = true;
      }
    }
    return busy;
  }

  private draw() {
    const { ctx, dpr, width, height, input, colors } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!input || width === 0 || height === 0 || this.rgb.length === 0) return;
    const { rows, cols } = input;
    const { size, left, top } = this.layout();
    const gap = Math.max(1, size * GAP);
    const radius = Math.min(6, size * 0.2);

    for (let cell = 0; cell < rows * cols; cell++) {
      const row = Math.floor(cell / cols);
      const col = cell % cols;
      const s = (size - gap) * this.scale[cell];
      const x = left + col * size + (size - s) / 2;
      const y = top + row * size + (size - s) / 2;
      const i = cell * 3;
      ctx.fillStyle = `rgb(${this.rgb[i] | 0} ${this.rgb[i + 1] | 0} ${this.rgb[i + 2] | 0})`;
      ctx.beginPath();
      ctx.roundRect(x, y, s, s, radius);
      ctx.fill();
      if (this.tones[input.tones[cell]].dots && size >= 10) {
        // eslint-disable-next-line house/no-raw-colors -- translucent so the dots darken whatever color the cell has now (in pathfinding, mud plain, visited or frontier); not a backdrop, so not --color-scrim.
        ctx.fillStyle = `rgb(0 0 0 / 0.18)`;
        const d = Math.max(1, s * 0.09);
        for (const [fx, fy] of [[0.3, 0.32], [0.68, 0.45], [0.42, 0.7]]) {
          ctx.beginPath();
          ctx.arc(x + s * fx, y + s * fy, d, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (this.tones[input.tones[cell]].cross && s >= 6) {
        // In the stage's background color, as if cut out of the cell.
        ctx.strokeStyle = colors.background;
        ctx.lineWidth = Math.max(1.5, s * 0.12);
        ctx.lineCap = "round";
        const inset = s * 0.28;
        ctx.beginPath();
        ctx.moveTo(x + inset, y + inset);
        ctx.lineTo(x + s - inset, y + s - inset);
        ctx.moveTo(x + s - inset, y + inset);
        ctx.lineTo(x + inset, y + s - inset);
        ctx.stroke();
      }
    }

    // The cell being examined: a ring that follows the search. A light stroke on the cell's edge
    // and a dark one just inside it, so one of them stands out on any cell, light or dark.
    if (input.current != null) {
      const row = Math.floor(input.current / cols);
      const col = input.current % cols;
      const x = left + col * size + gap / 2;
      const y = top + row * size + gap / 2;
      const s = size - gap;
      const w = Math.max(1.5, size * 0.08);
      ctx.lineWidth = w;
      ctx.strokeStyle = colors.ringOuter;
      ctx.beginPath();
      ctx.roundRect(x, y, s, s, radius);
      ctx.stroke();
      ctx.strokeStyle = colors.ringInner;
      ctx.beginPath();
      ctx.roundRect(x + w, y + w, s - 2 * w, s - 2 * w, Math.max(0, radius - w));
      ctx.stroke();
    }

    if (input.start != null) this.drawMarker(input.start, "start", size, left, top);
    if (input.end != null) this.drawMarker(input.end, "end", size, left, top);
    // Last, so a letter stays readable even on the target.
    for (const mark of input.marks ?? []) this.drawMark(mark, size, left, top, gap, radius);
  }

  /**
   * A cell guess mode asks about: a badge in the text color over the whole tile, its letter
   * cut out in the background color, bold and never under 11px, so it reads on any cell.
   */
  private drawMark(mark: GridMark, size: number, left: number, top: number, gap: number, radius: number) {
    const { ctx, colors, input } = this;
    const cols = input!.cols;
    const s = size - gap;
    const x = left + (mark.cell % cols) * size + gap / 2;
    const y = top + Math.floor(mark.cell / cols) * size + gap / 2;
    ctx.fillStyle = colors.foreground;
    ctx.beginPath();
    ctx.roundRect(x, y, s, s, radius);
    ctx.fill();
    ctx.fillStyle = colors.background;
    ctx.font = `700 ${Math.max(MARK_MIN_FONT, Math.round(size * 0.6))}px "Instrument Sans Variable", ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(mark.label, x + s / 2, y + s / 2 + 1);
  }

  /** Start: a filled dot. End: a target of two rings. Both sit on top of their cell. */
  private drawMarker(cell: number, kind: "start" | "end", size: number, left: number, top: number) {
    const { ctx, colors, input } = this;
    const cols = input!.cols;
    const cx = left + (cell % cols) * size + size / 2;
    const cy = top + Math.floor(cell / cols) * size + size / 2;
    const r = size * 0.34;
    ctx.lineWidth = Math.max(1.5, size * 0.09);
    if (kind === "start") {
      ctx.fillStyle = colors.primary;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.background;
      ctx.stroke();
    } else {
      ctx.fillStyle = colors.background;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.foreground;
      ctx.stroke();
      ctx.fillStyle = colors.foreground;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
