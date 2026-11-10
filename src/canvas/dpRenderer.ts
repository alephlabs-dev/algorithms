import {
  alignment,
  itemName,
  keptLetters,
  KnapsackRun,
  takenItems,
  type DpFrame,
  type DpRun,
  type TableRun,
} from "@/dp";
import { css, inkOn, mix, readColors, structurePalette, type RGB } from "./theme";
import { localized } from "@/i18n";

const text = localized({
  en: {
    hints: {
      edit: "The edits will show here, read off the way back.",
      lcs: "The shared letters will show here.",
      knapsack: "What goes in the bag will show here.",
    },
    noItems: "no items",
  },
  es: {
    hints: {
      edit: "Aquí aparecerán las ediciones, leídas en el camino de vuelta.",
      lcs: "Aquí aparecerán las letras compartidas.",
      knapsack: "Aquí aparecerá lo que va en la mochila.",
    },
    noItems: "sin objetos",
  },
});


export type DpRenderInput = {
  run: TableRun;
  frame: DpFrame;
  /** Guess mode: the frame of the cell being asked about, shown with its neighbors but not its value. */
  ask?: DpFrame;
};

const MONO = `"JetBrains Mono", ui-monospace, monospace`;
const SANS = `"Instrument Sans", system-ui, sans-serif`;
const DOLLAR = "$";
const itemText = (item: { weight: number; value: number }) => `${item.weight}kg ` + DOLLAR + item.value;

const HINTS = text.hints;

/**
 * Draws a dynamic programming table: one word down the side, the other
 * across the top, each cell's value once it's worked out. The cell being
 * filled, the cells it comes from (with arrows) and, at the end, the way back
 * from the corner are highlighted; under the table, the answer spelled out.
 */
export class DpRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private input: DpRenderInput | null = null;
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

  update(input: DpRenderInput) {
    this.input = input;
    this.draw();
  }

  private draw() {
    const { ctx, dpr, width, height, input } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!input || width === 0 || height === 0) return;
    const { run, ask } = input;
    // Asking: the cell in focus with where it comes from, but not yet filled, and no hint of which way wins.
    const frame = ask ? { ...ask, filled: ask.filled - 1 } : input.frame;
    const p = this.palette;
    const m = run.rowLabels.length - 1;
    const n = run.colLabels.length - 1;
    const knapsack = run instanceof KnapsackRun;
    const answerRoom = Math.min(110, height * 0.24);
    const pad = 10;
    // A knapsack's rows are items, labeled with their weight and value: a wider first column.
    const side = knapsack ? 2.2 : 1;
    const cell = Math.max(
      14,
      Math.min(52, (width - 2 * pad) / (n + 1 + side), (height - 2 * pad - answerRoom) / (m + 2)),
    );
    const gridW = cell * (n + 1 + side);
    const gridH = cell * (m + 2);
    const x0 = (width - gridW) / 2;
    const y0 = pad + Math.max(0, (height - 2 * pad - answerRoom - gridH) / 2);
    // Cell (i, j) of the table sits one row and one column in, after the labels.
    const at = (i: number, j: number) => ({ x: x0 + (j + side) * cell, y: y0 + (i + 1) * cell });

    const isFilled = (i: number, j: number) => {
      const k = run.fillIndex(i, j);
      return k < 0 ? frame.base : k < frame.filled;
    };
    const onPath = new Set(frame.trace.map((s) => `${s.i},${s.j}`));
    const deps = new Set(frame.deps.map((c) => `${c.i},${c.j}`));
    const e = frame.event;
    const pickedCell =
      e.type === "cell" ? e.options.find((o) => o.from === e.pick)!.cell : e.type === "trace" ? e.step.to : null;
    const picked = ask ? null : pickedCell && `${pickedCell.i},${pickedCell.j}`;
    const focus = frame.focus;
    const finished = e.type === "done";
    // The corner, once the way back is done, if the answer's path ends there too.
    if (finished) {
      onPath.add(`${m},${n}`);
      const last = run.trace[run.trace.length - 1];
      if (last) onPath.add(`${last.to.i},${last.to.j}`);
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Labels: the first word (or the items) down the side, the second word (or the room) across the top.
    const match = e.type === "cell" && e.match;
    const letterFill = (lit: boolean): RGB | null => (lit ? (match ? p.done : p.focus) : null);
    const letter = (text: string, x: number, y: number, fill: RGB | null, faint = false, size = 0.42) => {
      if (fill) {
        ctx.fillStyle = css(fill);
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 3, cell - 6, cell - 6, 8);
        ctx.fill();
      }
      ctx.fillStyle = css(fill ? inkOn(fill, p) : p.ink, faint ? 0.4 : 0.9);
      ctx.font = `600 ${Math.round(cell * size)}px ${faint ? SANS : MONO}`;
      ctx.fillText(text, x + cell / 2, y + cell / 2 + 1);
    };
    if (run instanceof KnapsackRun) {
      for (let j = 0; j <= n; j++) letter(run.colLabels[j], at(0, j).x, y0, letterFill(focus?.j === j), false, 0.34);
      for (let i = 0; i <= m; i++)
        this.itemLabel(run, i, x0, at(i, 0).y, cell * side, cell, letterFill(focus?.i === i && i > 0));
    } else {
      letter("ε", at(0, 0).x, y0, null, true);
      letter("ε", x0, at(0, 0).y, null, true);
      for (let j = 1; j <= n; j++) letter(run.colLabels[j], at(0, j).x, y0, letterFill(focus?.j === j));
      for (let i = 1; i <= m; i++) letter(run.rowLabels[i], x0, at(i, 0).y, letterFill(focus?.i === i));
    }

    // Cells.
    for (let i = 0; i <= m; i++) {
      for (let j = 0; j <= n; j++) {
        const { x, y } = at(i, j);
        const key = `${i},${j}`;
        const filled = isFilled(i, j);
        const isFocus = focus?.i === i && focus?.j === j;
        let fill: RGB = filled ? p.node : mix(p.background, p.node, 0.45);
        if (deps.has(key)) fill = p.path;
        if (onPath.has(key)) fill = p.done;
        if (isFocus) fill = e.type === "trace" ? p.done : p.focus;
        ctx.fillStyle = css(fill);
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, cell - 4, cell - 4, Math.min(8, cell * 0.18));
        ctx.fill();
        if (key === picked || isFocus) {
          ctx.strokeStyle = css(p.ink);
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (fill === p.node) {
          ctx.strokeStyle = css(p.ring, 0.6);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        if (ask && isFocus) {
          ctx.fillStyle = css(inkOn(fill, p));
          ctx.font = `700 ${Math.round(cell * 0.42)}px ${SANS}`;
          ctx.fillText("?", x + cell / 2, y + cell / 2 + 1);
        }
        if (filled) {
          ctx.fillStyle = css(inkOn(fill, p));
          ctx.font = `600 ${Math.round(cell * 0.38)}px ${MONO}`;
          ctx.fillText(String(run.table[i][j]), x + cell / 2, y + cell / 2 + 1);
        }
      }
    }

    // Arrows from each cell the focus comes from (the way back: to where it goes next).
    if (focus && frame.deps.length) {
      for (const d of frame.deps) {
        const from = at(d.i, d.j);
        const to = at(focus.i, focus.j);
        const chosen = `${d.i},${d.j}` === picked;
        const [ax, ay, bx, by] =
          e.type === "trace"
            ? [to.x + cell / 2, to.y + cell / 2, from.x + cell / 2, from.y + cell / 2]
            : [from.x + cell / 2, from.y + cell / 2, to.x + cell / 2, to.y + cell / 2];
        this.arrow(ax, ay, bx, by, cell, chosen ? p.ink : p.ring, chosen ? 2.2 : 1.4);
      }
    }

    this.drawAnswer(run, frame, y0 + gridH + 14, answerRoom - 14);
  }

  /** Knapsack: an item's row label, its name then its weight and value. */
  private itemLabel(run: KnapsackRun, i: number, x: number, y: number, w: number, h: number, fill: RGB | null) {
    const { ctx } = this;
    const p = this.palette;
    if (fill) {
      ctx.fillStyle = css(fill);
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, w - 6, h - 6, 8);
      ctx.fill();
    }
    const ink = fill ? inkOn(fill, p) : p.ink;
    if (i === 0) {
      ctx.fillStyle = css(ink, 0.4);
      ctx.font = `600 ${Math.round(h * 0.3)}px ${SANS}`;
      ctx.fillText(text.noItems, x + w / 2, y + h / 2 + 1);
      return;
    }
    const item = run.items[i - 1];
    ctx.fillStyle = css(ink, 0.95);
    ctx.font = `700 ${Math.round(h * 0.36)}px ${MONO}`;
    ctx.fillText(itemName(i - 1), x + w * 0.2, y + h / 2 + 1);
    ctx.fillStyle = css(ink, 0.75);
    ctx.font = `500 ${Math.round(h * 0.26)}px ${MONO}`;
    ctx.fillText(itemText(item), x + w * 0.62, y + h / 2 + 1);
  }

  /** A short arrow between two cell centers, trimmed so it doesn't cover the numbers. */
  private arrow(ax: number, ay: number, bx: number, by: number, cell: number, color: RGB, width: number) {
    const { ctx } = this;
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    if (!len) return;
    const ux = dx / len;
    const uy = dy / len;
    const trim = cell * 0.36;
    const sx = ax + ux * trim;
    const sy = ay + uy * trim;
    const ex = bx - ux * trim;
    const ey = by - uy * trim;
    ctx.strokeStyle = css(color);
    ctx.fillStyle = css(color);
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    const head = Math.max(4, cell * 0.12);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - ux * head - uy * head * 0.6, ey - uy * head + ux * head * 0.6);
    ctx.lineTo(ex - ux * head + uy * head * 0.6, ey - uy * head - ux * head * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  /** Under the table: the alignment (edit distance) or the shared letters (LCS), as far as the way back has got. */
  private drawAnswer(run: TableRun, frame: DpFrame, top: number, room: number) {
    const { ctx, width } = this;
    const p = this.palette;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (!frame.trace.length) {
      if (frame.event.type !== "start") return;
      ctx.fillStyle = css(p.ink, 0.6);
      ctx.font = `500 14px ${SANS}`;
      ctx.fillText(HINTS[run.algorithm], width / 2, top + room / 2);
      return;
    }
    if (run instanceof KnapsackRun) this.drawBag(run, frame, top, room);
    else this.drawWords(run as DpRun, frame, top, room);
  }

  /** Knapsack: the items taken so far, and what they add up to. */
  private drawBag(run: KnapsackRun, frame: DpFrame, top: number, room: number) {
    const { ctx, width } = this;
    const p = this.palette;
    const chosen = takenItems(frame.trace);
    const all = run.chosen.length;
    const box = Math.min(56, room * 0.62, (width - 24) / Math.max(1, all + 1.6));
    const x0 = width / 2 - (box * (all + 1.6)) / 2;
    for (let k = 0; k < all; k++) {
      // Found from the last item back, so the ones still to come are on the left.
      const index = chosen[k - (all - chosen.length)];
      const x = x0 + k * box;
      const lit = index !== undefined;
      ctx.fillStyle = css(lit ? p.done : p.node);
      ctx.beginPath();
      ctx.roundRect(x + 3, top + 4, box - 6, box - 6, 8);
      ctx.fill();
      if (!lit) continue;
      ctx.fillStyle = css(inkOn(p.done, p));
      ctx.font = `700 ${Math.round(box * 0.34)}px ${MONO}`;
      ctx.fillText(itemName(index), x + box / 2, top + 4 + box * 0.32);
      ctx.font = `500 ${Math.round(box * 0.2)}px ${MONO}`;
      ctx.fillText(itemText(run.items[index]), x + box / 2, top + 4 + box * 0.66);
    }
    const weight = chosen.reduce((sum, k) => sum + run.items[k].weight, 0);
    const value = chosen.reduce((sum, k) => sum + run.items[k].value, 0);
    const tx = x0 + all * box + 8;
    ctx.textAlign = "left";
    ctx.fillStyle = css(p.ink, 0.85);
    ctx.font = `600 ${Math.round(Math.max(11, box * 0.26))}px ${MONO}`;
    ctx.fillText("= " + DOLLAR + value, tx, top + 4 + box * 0.32);
    ctx.fillStyle = css(p.ink, 0.6);
    ctx.font = `500 ${Math.round(Math.max(10, box * 0.2))}px ${MONO}`;
    ctx.fillText(`${weight}/${run.capacity}kg`, tx, top + 4 + box * 0.66);
    ctx.textAlign = "center";
  }

  /** The word problems: the alignment (edit distance) or the shared letters (LCS). */
  private drawWords(run: DpRun, frame: DpFrame, top: number, room: number) {
    const { ctx, width } = this;
    const p = this.palette;
    if (run.algorithm === "lcs") {
      const letters = keptLetters(run.a, frame.trace);
      const box = Math.min(34, room * 0.6, (width - 24) / Math.max(1, run.answer));
      const x0 = width / 2 - (box * run.answer) / 2;
      // Not found yet: blank boxes, filled in from the end as the way back finds them.
      for (let k = 0; k < run.answer; k++) {
        const ch = letters[k - (run.answer - letters.length)];
        const x = x0 + k * box;
        ctx.fillStyle = css(ch ? p.done : p.node);
        ctx.beginPath();
        ctx.roundRect(x + 2, top + 4, box - 4, box - 4, 6);
        ctx.fill();
        if (ch) {
          ctx.fillStyle = css(inkOn(p.done, p));
          ctx.font = `600 ${Math.round(box * 0.5)}px ${MONO}`;
          ctx.fillText(ch, x + box / 2, top + 4 + (box - 4) / 2 + 1);
        }
      }
      return;
    }
    // Edit distance: the first word over the second, column by column, with what each column costs.
    const columns = alignment(run.a, run.b, frame.trace);
    const total = run.a.length + run.b.length; // enough room for any alignment
    const box = Math.min(34, room / 2.6, (width - 24) / Math.max(columns.length, Math.min(total, run.a.length + 2)));
    // Columns arrive from the end, so they're right-aligned against where the full alignment ends.
    const full = alignment(run.a, run.b, run.trace).length;
    const x0 = width / 2 - (box * full) / 2 + (full - columns.length) * box;
    const color = (kind: string) => (kind === "match" ? p.done : kind === "replace" ? p.focus : p.warn);
    columns.forEach((c, k) => {
      const x = x0 + k * box;
      const fill = color(c.kind);
      for (const [row, ch] of [
        [0, c.top],
        [2, c.bottom],
      ] as const) {
        const y = top + row * box * 0.75;
        ctx.fillStyle = css(ch ? fill : p.background);
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, box - 4, box - 4, 5);
        ctx.fill();
        if (!ch) {
          ctx.strokeStyle = css(p.ring);
          ctx.setLineDash([3, 3]);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.fillStyle = css(inkOn(fill, p));
        ctx.font = `600 ${Math.round(box * 0.48)}px ${MONO}`;
        ctx.fillText(ch ?? "", x + box / 2, y + box / 2 + 1);
      }
      ctx.fillStyle = css(p.ink, 0.7);
      ctx.font = `600 ${Math.round(box * 0.42)}px ${MONO}`;
      const mark = c.kind === "match" ? "|" : c.kind === "replace" ? "~" : c.kind === "delete" ? "−" : "+";
      ctx.fillText(mark, x + box / 2, top + box * 0.75 + box / 2 + 1);
    });
  }
}
