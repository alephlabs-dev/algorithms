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

/**
 * A line drawing (points joined by strokes, like a constellation) as one
 * closed path: it walks every stroke there and back, depth first, and ends
 * where it began, so circles can trace it.
 */
export const strokeWalk = (points: Point[], strokes: [number, number][], start = 0): Point[] => {
  const used = new Set<number>();
  const path = [points[start]];
  const visit = (node: number) => {
    strokes.forEach(([a, b], k) => {
      if (used.has(k) || (a !== node && b !== node)) return;
      used.add(k);
      const next = a === node ? b : a;
      path.push(points[next]);
      visit(next);
      path.push(points[node]);
    });
  };
  visit(start);
  // Every stroke has to be reachable from the start, or part of the drawing would silently go missing.
  if (used.size !== strokes.length) throw new Error("strokeWalk: some strokes aren't connected to the start");
  return path;
};

/**
 * Stars and the lines between them, as a closed path, with the stars kept to
 * draw on top. Lines that cross between stars meet at `crossings`, numbered
 * after the stars.
 */
const constellation = (stars: Point[], lines: [number, number][], crossings: Point[] = []) => ({
  path: strokeWalk([...stars, ...crossings], lines),
  stars,
});

/** A shape's geometry: its outline (closed, y going down), and for constellations its stars. */
type Geometry = { path: Point[]; stars?: Point[] };

const presets: Record<Exclude<FourierShape, "custom">, () => Geometry> = {
  heart: () => ({
    path: curve((t) => ({
      x: 16 * Math.sin(t) ** 3,
      y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
    })),
  }),
  star: () => ({
    path: Array.from({ length: 10 }, (_, k) => {
      const angle = -Math.PI / 2 + (k * Math.PI) / 5;
      const r = k % 2 === 0 ? 1 : 0.42;
      return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
    }),
  }),
  // Lemniscate of Bernoulli: the figure eight.
  infinity: () => ({
    path: curve((t) => ({
      x: Math.cos(t) / (1 + Math.sin(t) ** 2),
      y: (Math.sin(t) * Math.cos(t)) / (1 + Math.sin(t) ** 2),
    })),
  }),
  square: () => ({
    path: [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
    ],
  }),

  // Constellations as they look in the sky (north up, east to the left), stars placed to scale.
  crux: () =>
    constellation(
      [
        { x: 0.05, y: -1 }, // Gacrux
        { x: 0.12, y: 1 }, // Acrux
        { x: -0.62, y: 0.02 }, // Mimosa
        { x: 0.6, y: -0.22 }, // Imai (δ Crucis)
        { x: 0.38, y: 0.42 }, // Ginan (ε Crucis)
      ],
      // The two bars of the cross meet between stars, at point 5.
      [
        [0, 5],
        [5, 1],
        [2, 5],
        [5, 3],
      ],
      [{ x: 0.081, y: -0.118 }],
    ),
  orion: () =>
    constellation(
      [
        { x: 0, y: -1.05 }, // Meissa
        { x: -0.55, y: -0.72 }, // Betelgeuse
        { x: 0.48, y: -0.62 }, // Bellatrix
        { x: -0.16, y: 0.06 }, // Alnitak
        { x: 0, y: 0 }, // Alnilam
        { x: 0.16, y: -0.06 }, // Mintaka
        { x: -0.42, y: 0.86 }, // Saiph
        { x: 0.58, y: 0.74 }, // Rigel
      ],
      [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 5],
        [3, 4],
        [4, 5],
        [3, 6],
        [5, 7],
      ],
    ),
  dipper: () =>
    constellation(
      [
        { x: 0.95, y: -0.38 }, // Dubhe
        { x: 0.98, y: 0.16 }, // Merak
        { x: 0.46, y: 0.28 }, // Phecda
        { x: 0.38, y: -0.14 }, // Megrez
        { x: -0.02, y: -0.24 }, // Alioth
        { x: -0.45, y: -0.3 }, // Mizar
        { x: -0.95, y: -0.04 }, // Alkaid
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [3, 4],
        [4, 5],
        [5, 6],
      ],
    ),
  cassiopeia: () =>
    constellation(
      [
        { x: 1, y: -0.12 }, // Caph
        { x: 0.5, y: 0.42 }, // Schedar
        { x: 0, y: 0 }, // Navi
        { x: -0.48, y: 0.38 }, // Ruchbah
        { x: -1, y: -0.18 }, // Segin
      ],
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
      ],
    ),

  // ℵ, as in Aleph Labs: a diagonal with an arm reaching up on the right and a leg down on the left.
  aleph: () => ({
    path: strokeWalk(
      [
        { x: -0.62, y: -0.88 }, // the diagonal, top
        { x: -0.17, y: -0.26 }, // where the arm leaves it
        { x: 0.14, y: 0.18 }, // where the leg leaves it
        { x: 0.6, y: 0.86 }, // the diagonal, bottom
        { x: 0.34, y: -0.44 },
        { x: 0.6, y: -0.9 }, // the arm's tip
        { x: -0.28, y: 0.38 },
        { x: -0.42, y: 0.86 }, // the leg's foot
        { x: -0.72, y: 0.86 },
        { x: -0.84, y: -0.88 }, // a serif at the top
      ],
      [
        [9, 0],
        [0, 1],
        [1, 2],
        [2, 3],
        [1, 4],
        [4, 5],
        [2, 6],
        [6, 7],
        [7, 8],
      ],
    ),
  }),
  // Temple Fay's butterfly curve, r = e^cos t − 2 cos 4t: one lap already draws all four wings.
  butterfly: () => ({
    path: curve((t) => {
      const r = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t);
      return { x: Math.sin(t) * r, y: -Math.cos(t) * r };
    }, 1200),
  }),
  // The fish curve: an ellipse that crosses itself into a tail.
  fish: () => ({
    path: curve((t) => ({ x: Math.cos(t) - Math.sin(t) ** 2 / Math.SQRT2, y: Math.cos(t) * Math.sin(t) })),
  }),
  cat: () => ({
    path: [
      { x: -0.62, y: -1 }, // left ear
      { x: -0.34, y: -0.56 },
      { x: 0.34, y: -0.56 },
      { x: 0.62, y: -1 }, // right ear
      { x: 0.84, y: -0.32 },
      { x: 0.92, y: 0.14 },
      { x: 0.7, y: 0.58 },
      { x: 0.28, y: 0.84 },
      { x: -0.28, y: 0.84 },
      { x: -0.7, y: 0.58 },
      { x: -0.92, y: 0.14 },
      { x: -0.84, y: -0.32 },
    ],
  }),
  // ♪: an oval head, a stem and a flag.
  note: () => {
    const head = Array.from({ length: 14 }, (_, k) => {
      const t = (k / 14) * 2 * Math.PI;
      const [x, y] = [0.34 * Math.cos(t), 0.24 * Math.sin(t)];
      const tilt = -0.45;
      return { x: -0.3 + x * Math.cos(tilt) - y * Math.sin(tilt), y: 0.62 + x * Math.sin(tilt) + y * Math.cos(tilt) };
    });
    const top = { x: 0.03, y: -0.95 };
    const points = [...head, top, { x: 0.5, y: -0.56 }, { x: 0.44, y: -0.16 }];
    const ring = head.map((_, k) => [k, (k + 1) % head.length] as [number, number]);
    // The stem rises from the right edge of the head (point 0 of the ring).
    return { path: strokeWalk(points, [...ring, [0, 14], [14, 15], [15, 16]]) };
  },
  bolt: () => ({
    path: [
      { x: 0.22, y: -1 },
      { x: -0.52, y: 0.12 },
      { x: -0.04, y: 0.12 },
      { x: -0.24, y: 1 },
      { x: 0.56, y: -0.18 },
      { x: 0.08, y: -0.18 },
      { x: 0.42, y: -1 },
    ],
  }),
};

/** Centers a drawing on its middle and scales it so its farthest point is 1 away; `also` moves with it. */
const normalizeWith = (points: Point[], also: Point[]) => {
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const reach = Math.max(...points.map((p) => Math.hypot(p.x - cx, p.y - cy))) || 1;
  const move = (p: Point) => ({ x: (p.x - cx) / reach, y: (p.y - cy) / reach });
  return { points: points.map(move), also: also.map(move) };
};

/** A drawing ready for its transform: resampled evenly and normalized, with its stars if it has any. */
export const shapeData = (shape: FourierShape, custom: Point[] | null): { points: Point[]; stars: Point[] } => {
  const geometry: Geometry =
    shape === "custom" && custom && custom.length >= 3
      ? { path: custom }
      : presets[shape === "custom" ? "heart" : shape]();
  const { points, also } = normalizeWith(resample(geometry.path, SAMPLES), geometry.stars ?? []);
  return { points, stars: also };
};

export const shapePoints = (shape: FourierShape, custom: Point[] | null): Point[] => shapeData(shape, custom).points;

// Links carry a hand-drawn shape as 64 points, each coordinate in a byte.

const LINK_POINTS = 64;

const toByte = (v: number) => Math.min(255, Math.max(0, Math.round(((v + 1) / 2) * 255)));
const fromByte = (b: number) => (b / 255) * 2 - 1;

/**
 * A hand-drawn stroke as its link carries it: normalized, 64 points, each
 * coordinate rounded to a byte. Fitting happens once, when the drawing is
 * made, so the drawer sees what the link shows and the link never drifts.
 */
export const linkShape = (points: Point[]): Point[] =>
  resample(normalize(points), LINK_POINTS).map((p) => ({ x: fromByte(toByte(p.x)), y: fromByte(toByte(p.y)) }));

/** A shape from `linkShape` (or `decodePath`) as link text; it only packs the points, so decoding gives them back. */
export const encodePath = (points: Point[]): string => {
  const bytes = points.flatMap((p) => [toByte(p.x), toByte(p.y)]);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const decodePath = (text: string): Point[] | null => {
  try {
    const bytes = [...atob(text.replace(/-/g, "+").replace(/_/g, "/"))].map((c) => c.charCodeAt(0));
    if (bytes.length !== LINK_POINTS * 2) return null;
    return Array.from({ length: LINK_POINTS }, (_, k) => ({ x: fromByte(bytes[2 * k]), y: fromByte(bytes[2 * k + 1]) }));
  } catch {
    return null;
  }
};
