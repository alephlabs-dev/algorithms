import type { Operation } from "@/structures";
import { hexToRgb, type CanvasColors, type RGB } from "./theme";

/* Colors and pieces shared by the data structure renderers. */

export const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
export const css = (c: RGB, alpha = 1) => `rgb(${c[0] | 0} ${c[1] | 0} ${c[2] | 0} / ${alpha})`;
export const luminance = (c: RGB) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;

export const structurePalette = (colors: CanvasColors) => {
  const background = hexToRgb(colors.background);
  const muted = hexToRgb(colors.muted);
  const secondary = hexToRgb(colors.secondary);
  const isLight = luminance(background) > 0.5;
  return {
    background,
    ink: hexToRgb(colors.foreground),
    node: mix(background, hexToRgb(colors.edge), 0.9),
    ring: mix(background, muted, 0.7),
    edge: mix(background, muted, 0.55),
    path: mix(background, secondary, isLight ? 0.3 : 0.42),
    focus: secondary,
    done: hexToRgb(colors.primary),
    warn: hexToRgb(colors.tertiary),
  };
};
export type StructurePalette = ReturnType<typeof structurePalette>;

/** Text color that reads on `fill`: the ink or the background, whichever contrasts more. */
export const inkOn = (fill: RGB, p: StructurePalette) =>
  Math.abs(luminance(fill) - luminance(p.ink)) > Math.abs(luminance(fill) - luminance(p.background))
    ? p.ink
    : p.background;

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
  const long = `Press play to insert ${values.length === 1 ? "1 value" : `${values.length} values`}, in this order`;
  ctx.fillText(ctx.measureText(long).width < width - 32 ? long : "Press play to insert", width / 2, top - label);
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
