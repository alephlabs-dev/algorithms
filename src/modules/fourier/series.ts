import type { FourierAlgorithm, Point, Term } from "./types";

export type Wave = Exclude<FourierAlgorithm, "epicycles">;

/**
 * The first `count` non-zero terms of a wave's sine series. Each term is a
 * circle; its vertical part is the sine, so the stacked tips trace the wave.
 *   square:   (4/π) Σ sin(nθ)/n,            n = 1, 3, 5…
 *   sawtooth: (2/π) Σ (−1)^(n+1) sin(nθ)/n, n = 1, 2, 3…
 *   triangle: (8/π²) Σ (−1)^k sin(nθ)/n²,   n = 2k+1
 */
export const waveTerms = (wave: Wave, count: number): Term[] => {
  const terms: Term[] = [];
  for (let k = 0; terms.length < count; k++) {
    if (wave === "sawtooth") {
      const n = k + 1;
      terms.push({ freq: n, amp: 2 / (Math.PI * n), phase: n % 2 === 1 ? 0 : Math.PI });
    } else {
      const n = 2 * k + 1;
      if (wave === "square") terms.push({ freq: n, amp: 4 / (Math.PI * n), phase: 0 });
      else terms.push({ freq: n, amp: 8 / (Math.PI * Math.PI * n * n), phase: k % 2 === 0 ? 0 : Math.PI });
    }
  }
  return terms;
};

/** The wave itself at angle θ (radians), what the series is building towards. Peaks at ±1. */
export const waveAt = (wave: Wave, theta: number): number => {
  const t = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); // 0 to 2π
  if (wave === "square") return t === 0 || t === Math.PI ? 0 : t < Math.PI ? 1 : -1;
  if (wave === "sawtooth") return t < Math.PI ? t / Math.PI : t / Math.PI - 2;
  // Triangle: 0 → 1 at π/2 → −1 at 3π/2 → 0.
  if (t < Math.PI / 2) return t / (Math.PI / 2);
  if (t < (3 * Math.PI) / 2) return 1 - (t - Math.PI / 2) / (Math.PI / 2);
  return -1 + (t - (3 * Math.PI) / 2) / (Math.PI / 2);
};

/**
 * The discrete Fourier transform of a closed path of N points, as circles:
 *   c[k] = (1/N) Σ z[j] · e^(−2πi·k·j/N),  for k = −N/2 … N/2 − 1
 * Each c[k] turns k times per turn (negative k: the other way). Sorted from
 * the biggest circle down, so the first few carry most of the shape.
 */
export const dft = (points: Point[]): Term[] => {
  const n = points.length;
  const terms: Term[] = [];
  for (let k = -Math.floor(n / 2); k < Math.ceil(n / 2); k++) {
    let re = 0;
    let im = 0;
    for (let j = 0; j < n; j++) {
      const angle = (-2 * Math.PI * k * j) / n;
      re += points[j].x * Math.cos(angle) - points[j].y * Math.sin(angle);
      im += points[j].x * Math.sin(angle) + points[j].y * Math.cos(angle);
    }
    terms.push({ freq: k, amp: Math.hypot(re, im) / n, phase: Math.atan2(im, re) });
  }
  return terms.sort((p, q) => q.amp - p.amp || Math.abs(p.freq) - Math.abs(q.freq));
};

/** Where each circle's tip is at angle θ: the chain from the center out, the last point being the drawing tip. */
export const chainAt = (terms: Term[], theta: number, origin: Point = { x: 0, y: 0 }): Point[] => {
  const chain = [origin];
  let { x, y } = origin;
  for (const term of terms) {
    const angle = term.freq * theta + term.phase;
    x += term.amp * Math.cos(angle);
    y += term.amp * Math.sin(angle);
    chain.push({ x, y });
  }
  return chain;
};
