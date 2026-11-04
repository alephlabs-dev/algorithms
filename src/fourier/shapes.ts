import type { FourierShape, Point } from "./types";

/** How many points a drawing is sampled at before its transform: as many circles as it can have. */
export const SAMPLES = 256;

/** A closed path through `points`, resampled to `count` points evenly spaced along its length. */
export const resample = (points: Point[], count: number): Point[] => {
  const closed = [...points, points[0]];
  const lengths = [0];
  for (let k = 1; k < closed.length; k++) {
    lengths.push(lengths[k - 1] + Math.hypot(closed[k].x - closed[k - 1].x, closed[k].y - closed[k - 1].y));
  }
  const total = lengths[lengths.length - 1] || 1;
  const out: Point[] = [];
  let segment = 1;
  for (let i = 0; i < count; i++) {
    const at = (i / count) * total;
    while (segment < lengths.length - 1 && lengths[segment] < at) segment++;
    const span = lengths[segment] - lengths[segment - 1] || 1;
    const t = (at - lengths[segment - 1]) / span;
    const [p, q] = [closed[segment - 1], closed[segment]];
    out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
  }
  return out;
};

/** Centers a drawing on its middle and scales it so its farthest point is 1 away. */
export const normalize = (points: Point[]): Point[] => {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  const reach = Math.max(...points.map((p) => Math.hypot(p.x - cx, p.y - cy))) || 1;
  return points.map((p) => ({ x: (p.x - cx) / reach, y: (p.y - cy) / reach }));
};

const curve = (f: (t: number) => Point, count = 400) =>
  Array.from({ length: count }, (_, k) => f((k / count) * 2 * Math.PI));

const polygon = (corners: Point[]) => corners;

/** The ready-made drawings. Screen coordinates: y grows downwards. */
const presetPoints: Record<Exclude<FourierShape, "custom">, () => Point[]> = {
  heart: () =>
    curve((t) => ({
      x: 16 * Math.sin(t) ** 3,
      y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
    })),
  star: () =>
    polygon(
      Array.from({ length: 10 }, (_, k) => {
        const angle = -Math.PI / 2 + (k * Math.PI) / 5;
        const r = k % 2 === 0 ? 1 : 0.42;
        return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
      }),
    ),
  // Lemniscate of Bernoulli: the figure eight.
  infinity: () =>
    curve((t) => ({
      x: Math.cos(t) / (1 + Math.sin(t) ** 2),
      y: (Math.sin(t) * Math.cos(t)) / (1 + Math.sin(t) ** 2),
    })),
  square: () =>
    polygon([
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
    ]),
};

/** A drawing ready for its transform: resampled evenly and normalized. */
export const shapePoints = (shape: FourierShape, custom: Point[] | null): Point[] => {
  const raw =
    shape === "custom" && custom && custom.length >= 3 ? custom : presetPoints[shape === "custom" ? "heart" : shape]();
  return normalize(resample(raw, SAMPLES));
};

// Links carry a hand-drawn shape as 64 points, each coordinate in a byte.

const LINK_POINTS = 64;

export const encodePath = (points: Point[]): string => {
  const bytes = resample(normalize(points), LINK_POINTS).flatMap((p) => [
    Math.round(((p.x + 1) / 2) * 255),
    Math.round(((p.y + 1) / 2) * 255),
  ]);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const decodePath = (text: string): Point[] | null => {
  try {
    const bytes = [...atob(text.replace(/-/g, "+").replace(/_/g, "/"))].map((c) => c.charCodeAt(0));
    if (bytes.length !== LINK_POINTS * 2) return null;
    return Array.from({ length: LINK_POINTS }, (_, k) => ({
      x: (bytes[2 * k] / 255) * 2 - 1,
      y: (bytes[2 * k + 1] / 255) * 2 - 1,
    }));
  } catch {
    return null;
  }
};
