import type { Operation } from "@/structures";
import { css, luminance, type StructurePalette } from "./theme";
import { localized } from "@/i18n";

const text = localized({
  en: {
    pressPlay: (n: number) => `Press play to insert ${n === 1 ? "1 value" : `${n} values`}, in this order`,
    short: "Press play to insert",
  },
  es: {
    pressPlay: (n) => `Presiona play para insertar ${n === 1 ? "1 valor" : `${n} valores`}, en este orden`,
    short: "Presiona play para insertar",
  },
});



/** Room kept along the top for the operations queue. */
export const QUEUE_HEIGHT = 52;

/** The operations in order, as a strip along the top: done ones faded, the current one filled. */
export const drawOpsQueue = (
  ctx: CanvasRenderingContext2D,
  p: StructurePalette,
  width: number,
  ops: Operation[],
  current: number,
) => {
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
  if (first > 0) queueMore(ctx, p, x0 - step * 0.75, y, "‹");
  if (first + shown.length < ops.length) queueMore(ctx, p, x0 + shown.length * step - step * 0.25, y, "›");
};

const queueMore = (ctx: CanvasRenderingContext2D, p: StructurePalette, x: number, y: number, mark: string) => {
  ctx.fillStyle = css(p.ring);
  ctx.font = `600 14px "Instrument Sans", system-ui, sans-serif`;
  ctx.fillText(mark, x, y);
};

/** The values about to be inserted, as a queue of outlined nodes, the next one ringed. */
export const drawWaiting = (
  ctx: CanvasRenderingContext2D,
  p: StructurePalette,
  width: number,
  height: number,
  values: number[],
  top0?: number,
) => {
  const r = height < 260 ? 13 : 16;
  const step = r * 2 + 10;
  const perRow = Math.max(1, Math.min(values.length, Math.floor((width - 32) / step)));
  const rows = Math.ceil(values.length / perRow);
  const label = 30;
  const top = top0 ?? Math.max(label + 20, (height - rows * step + 10 + label) / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = css(p.ink, 0.75);
  ctx.font = `500 15px "Instrument Sans", system-ui, sans-serif`;
  const long = text.pressPlay(values.length);
  ctx.fillText(ctx.measureText(long).width < width - 32 ? long : text.short, width / 2, top - label);
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
};
