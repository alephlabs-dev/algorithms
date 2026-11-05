import { itemName, type KnapsackWork } from "@/dp";
import { css, inkOn, mix, structurePalette } from "./structurePaint";
import { readColors, type RGB } from "./theme";

export type DpWorkInput = { work: KnapsackWork; clock: number };

const MONO = `"JetBrains Mono", ui-monospace, monospace`;

/**
 * One race lane: the knapsack's table of subproblems, each cell showing how
 * many times this method has worked it out so far. Once is the accent color;
 * again and again turns it to the warning color, darker the more often.
 */
export class DpWorkRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private input: DpWorkInput | null = null;
  private palette = structurePalette(readColors());

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
  }

  destroy() {}

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
    this.draw();
  }

  update(input: DpWorkInput) {
    this.input = input;
    this.draw();
  }

  private draw() {
    const { ctx, dpr, width, height, input } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!input || width === 0 || height === 0) return;
    const { work, clock } = input;
    const p = this.palette;
    const rows = work.items.length + 1;
    const cols = work.capacity + 1;
    const pad = 6;
    const cell = Math.max(8, Math.min(40, (width - 2 * pad) / (cols + 1), (height - 2 * pad) / (rows + 1)));
    const x0 = (width - cell * (cols + 1)) / 2 + cell;
    const y0 = (height - cell * (rows + 1)) / 2 + cell;

    // How often each subproblem has been worked out (lookups don't count), and the one on the clock.
    const counts = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
    const upTo = Math.min(clock, work.length - 1);
    for (let k = 0; k <= upTo; k++) {
      const c = work.calls[k];
      if (!c.cached) counts[c.i][c.w]++;
    }
    const now = clock >= 0 && clock < work.length ? work.calls[clock] : null;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = Math.round(cell * 0.4);
    ctx.font = `600 ${label}px ${MONO}`;
    ctx.fillStyle = css(p.ink, 0.6);
    for (let w = 0; w < cols; w++) ctx.fillText(String(w), x0 + w * cell + cell / 2, y0 - cell / 2);
    for (let i = 0; i < rows; i++)
      ctx.fillText(i === 0 ? "–" : itemName(i - 1), x0 - cell / 2, y0 + i * cell + cell / 2);

    for (let i = 0; i < rows; i++) {
      for (let w = 0; w < cols; w++) {
        const n = counts[i][w];
        const x = x0 + w * cell;
        const y = y0 + i * cell;
        // Once: the accent. Twice and more: deeper and deeper into the warning color.
        const fill: RGB =
          n === 0
            ? mix(p.background, p.node, 0.5)
            : n === 1
              ? p.done
              : mix(p.node, p.warn, Math.min(1, 0.45 + n * 0.12));
        ctx.fillStyle = css(fill);
        ctx.beginPath();
        ctx.roundRect(x + 1.5, y + 1.5, cell - 3, cell - 3, Math.min(6, cell * 0.2));
        ctx.fill();
        if (now && now.i === i && now.w === w) {
          ctx.strokeStyle = css(now.cached ? p.focus : p.ink);
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        if (n > 1 && cell >= 16) {
          ctx.fillStyle = css(inkOn(fill, p));
          ctx.font = `700 ${Math.round(cell * 0.4)}px ${MONO}`;
          ctx.fillText(`${n}`, x + cell / 2, y + cell / 2 + 1);
        }
      }
    }
  }
}
