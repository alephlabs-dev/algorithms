import { FRONTIER, MUD, ON_PATH, VISITED, WALL, type Grid, type PathFrame } from "@/pathfinding";
import { hexToRgb, readColors, type CanvasColors, type RGB } from "./theme";

export type GridRenderInput = {
  grid: Grid;
  frame: PathFrame;
  /** Changes when the grid is replaced wholesale; cells snap instead of animating. */
  gridId: number;
  /** Seconds a color change takes. 0 snaps (scrubbing, very fast playback). */
  fade: number;
  /** Cells guess mode asks about, each with its letter, drawn on top of everything. */
  marks?: { cell: number; label: string }[];
};

const GAP = 0.08; // share of a cell left as a gap between cells
const POP_FROM = 0.45; // a cell that changes state grows from this scale

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/**
 * Draws a pathfinding grid on a canvas and animates changes: cells fade
 * between colors and pop in when they join the frontier, get visited or become
 * part of the path. Runs its own loop only while something is moving.
 */
export class GridRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private width = 0;
  private height = 0;
  private dpr = 1;
  private input: GridRenderInput | null = null;
  private colors = readColors();
  private palette = this.paletteFor(this.colors);
  // Per cell: current color, the state it last showed, and a pop spring.
  private rgb = new Float32Array(0);
  private shown = new Int16Array(0);
  private scale = new Float32Array(0);
  private scaleVelocity = new Float32Array(0);
  private lastTick = 0;
  private frameRequest = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    // Guess mode's letters use a web font; draw again once it's ready instead of keeping the fallback.
    document.fonts?.ready.then(() => this.draw());
  }

  destroy() {
    cancelAnimationFrame(this.frameRequest);
    this.frameRequest = 0;
  }

  refreshColors() {
    this.colors = readColors();
    this.palette = this.paletteFor(this.colors);
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
    const count = input.grid.rows * input.grid.cols;
    const fresh = !previous || previous.gridId !== input.gridId || this.rgb.length !== count * 3;
    if (fresh) {
      this.rgb = new Float32Array(count * 3);
      this.shown = new Int16Array(count).fill(-1);
      this.scale = new Float32Array(count).fill(1);
      this.scaleVelocity = new Float32Array(count);
      for (let cell = 0; cell < count; cell++) {
        this.rgb.set(this.targetColor(cell), cell * 3);
        this.shown[cell] = this.stateKey(cell);
      }
    } else if (!this.reducedMotion.matches && input.fade > 0) {
      // New states pop in; cells going back (stepping backwards) just fade.
      for (let cell = 0; cell < count; cell++) {
        const key = this.stateKey(cell);
        if (key !== this.shown[cell] && key > this.shown[cell]) this.scale[cell] = POP_FROM;
        this.shown[cell] = key;
      }
    } else {
      for (let cell = 0; cell < count; cell++) this.shown[cell] = this.stateKey(cell);
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
    if (row < 0 || col < 0 || row >= input.grid.rows || col >= input.grid.cols) return null;
    return row * input.grid.cols + col;
  }

  private paletteFor(colors: CanvasColors) {
    const background = hexToRgb(colors.background);
    const edge = hexToRgb(colors.edge);
    const secondary = hexToRgb(colors.secondary);
    const mud = hexToRgb(colors.mud);
    const isLight = background[0] + background[1] + background[2] > 384;
    const wash = isLight ? 0.24 : 0.38;
    return {
      empty: mix(background, edge, 0.55),
      // Walls are solid but quieter than the search colors, so the search stays the subject.
      wall: mix(background, hexToRgb(colors.bar), 0.55),
      mud,
      frontier: secondary,
      // Visited cells keep a wash of the search color over whatever terrain they are;
      // lighter on paper, where a strong color would flood the grid.
      visited: mix(background, secondary, wash),
      visitedMud: mix(mud, secondary, wash),
      path: hexToRgb(colors.primary),
    };
  }

  /** A number that grows as a cell moves along: unseen < frontier < visited < path. Terrain only matters at 0. */
  private stateKey(cell: number) {
    return this.input!.frame.states[cell];
  }

  private targetColor(cell: number): RGB {
    const { grid, frame } = this.input!;
    const terrain = grid.cells[cell];
    const p = this.palette;
    if (terrain === WALL) return p.wall;
    switch (frame.states[cell]) {
      case ON_PATH:
        return p.path;
      case VISITED:
        return terrain === MUD ? p.visitedMud : p.visited;
      case FRONTIER:
        return p.frontier;
      default:
        return terrain === MUD ? p.mud : p.empty;
    }
  }

  private layout() {
    const { rows, cols } = this.input!.grid;
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
    const count = input.grid.rows * input.grid.cols;
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
    const { grid, frame } = input;
    const { size, left, top } = this.layout();
    const gap = Math.max(1, size * GAP);
    const radius = Math.min(6, size * 0.2);

    for (let cell = 0; cell < grid.rows * grid.cols; cell++) {
      const row = Math.floor(cell / grid.cols);
      const col = cell % grid.cols;
      const s = (size - gap) * this.scale[cell];
      const x = left + col * size + (size - s) / 2;
      const y = top + row * size + (size - s) / 2;
      const i = cell * 3;
      ctx.fillStyle = `rgb(${this.rgb[i] | 0} ${this.rgb[i + 1] | 0} ${this.rgb[i + 2] | 0})`;
      ctx.beginPath();
      ctx.roundRect(x, y, s, s, radius);
      ctx.fill();
      // Mud gets a few dots, so it reads without relying on color alone.
      if (grid.cells[cell] === MUD && size >= 10 && frame.states[cell] !== ON_PATH) {
        // eslint-disable-next-line house/no-raw-colors -- translucent so the dots darken whatever color the mud cell has now (plain, visited, frontier); not a backdrop, so not --color-scrim.
        ctx.fillStyle = `rgb(0 0 0 / 0.18)`;
        const d = Math.max(1, s * 0.09);
        for (const [fx, fy] of [[0.3, 0.32], [0.68, 0.45], [0.42, 0.7]]) {
          ctx.beginPath();
          ctx.arc(x + s * fx, y + s * fy, d, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // The cell being examined: an outline that follows the search.
    if (frame.current !== null) {
      const row = Math.floor(frame.current / grid.cols);
      const col = frame.current % grid.cols;
      ctx.strokeStyle = colors.outline;
      ctx.lineWidth = Math.max(1.5, size * 0.08);
      ctx.beginPath();
      ctx.roundRect(left + col * size + gap / 2, top + row * size + gap / 2, size - gap, size - gap, radius);
      ctx.stroke();
    }

    this.drawMarker(grid.start, "start", size, left, top);
    this.drawMarker(grid.end, "end", size, left, top);
    // Last, so a letter stays readable even on the target.
    for (const mark of input.marks ?? []) this.drawMark(mark, size, left, top, gap, radius);
  }

  /** A cell guess mode asks about: a plain tile with a dashed outline and its letter. */
  private drawMark(mark: { cell: number; label: string }, size: number, left: number, top: number, gap: number, radius: number) {
    const { ctx, colors, input } = this;
    const cols = input!.grid.cols;
    const x = left + (mark.cell % cols) * size + gap / 2;
    const y = top + Math.floor(mark.cell / cols) * size + gap / 2;
    const s = size - gap;
    const width = Math.max(1.5, size * 0.08);
    ctx.fillStyle = colors.background;
    ctx.beginPath();
    ctx.roundRect(x, y, s, s, radius);
    ctx.fill();
    ctx.strokeStyle = colors.outline;
    ctx.lineWidth = width;
    ctx.setLineDash([size * 0.14, size * 0.1]);
    ctx.beginPath();
    ctx.roundRect(x + width / 2, y + width / 2, s - width, s - width, radius);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = colors.foreground;
    ctx.font = `700 ${Math.round(size * 0.55)}px "Instrument Sans Variable", ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(mark.label, x + s / 2, y + s / 2 + 1);
  }

  /** Start: a filled dot. End: a target of two rings. Both sit on top of their cell. */
  private drawMarker(cell: number, kind: "start" | "end", size: number, left: number, top: number) {
    const { ctx, colors, input } = this;
    const cols = input!.grid.cols;
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
