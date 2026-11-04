import { chainAt, dft, waveAt, waveTerms, type Wave } from "./series";
import { shapePoints } from "./shapes";
import type { FourierAlgorithm, FourierShape, Point, Term } from "./types";

const last = <T>(list: T[]) => list[list.length - 1];

/** Frames per turn of the slowest circle: one per degree. */
export const FRAMES_PER_TURN = 360;

/** Circle counts to pick from: waves need few to look right, drawings many. */
export const circleOptions: Record<"wave" | "drawing", number[]> = {
  wave: [1, 2, 3, 5, 10, 25],
  drawing: [3, 10, 25, 50, 100, 256],
};
export const defaultCircles = { wave: 5, drawing: 50 };

export const isWave = (algorithm: FourierAlgorithm): algorithm is Wave => algorithm !== "epicycles";

export type FourierFrame = {
  /** How far through the run, in radians of the slowest circle (0 to 2π per turn). */
  theta: number;
  /** Each circle's center, from the origin out; the last point is the tip. */
  chain: Point[];
  /** Waves: the series' value now, and the wave's. */
  value: number;
  target: number;
};

/**
 * A whole run: the circles for the chosen series and count, and where the tip
 * is at every frame. Waves play two turns, so the traced wave fills its strip;
 * drawings one, which closes the shape.
 */
export class FourierRun {
  readonly length: number;
  readonly terms: Term[];
  /** The drawing being rebuilt (drawings only), normalized. */
  readonly target: Point[];
  /** The tip at every frame. */
  readonly tips: Point[];
  /** How far the circles' path is from the goal, as a share of its size, over a whole turn. */
  readonly error: number;

  constructor(
    readonly algorithm: FourierAlgorithm,
    readonly circles: number,
    shape: FourierShape,
    custom: Point[] | null,
  ) {
    const turns = isWave(algorithm) ? 2 : 1;
    this.length = turns * FRAMES_PER_TURN + 1;
    if (isWave(algorithm)) {
      this.terms = waveTerms(algorithm, circles);
      this.target = [];
    } else {
      this.target = shapePoints(shape, custom);
      this.terms = dft(this.target).slice(0, circles);
    }
    this.tips = Array.from({ length: this.length }, (_, i) => {
      const chain = chainAt(this.terms, this.thetaAt(i));
      return chain[chain.length - 1];
    });
    this.error = this.measure();
  }

  thetaAt(index: number) {
    return (Math.min(Math.max(index, 0), this.length - 1) / FRAMES_PER_TURN) * 2 * Math.PI;
  }

  frameAt(index: number): FourierFrame {
    const theta = this.thetaAt(index);
    const chain = chainAt(this.terms, theta);
    const tip = chain[chain.length - 1];
    const wave = isWave(this.algorithm);
    return { theta, chain, value: wave ? tip.y : 0, target: wave ? waveAt(this.algorithm as Wave, theta) : 0 };
  }

  /** Waves: root-mean-square gap to the wave over one turn. Drawings: mean distance to the drawing, of its radius. */
  private measure() {
    if (isWave(this.algorithm)) {
      let sum = 0;
      for (let i = 0; i < FRAMES_PER_TURN; i++) {
        const theta = this.thetaAt(i);
        const value = last(chainAt(this.terms, theta)).y;
        sum += (value - waveAt(this.algorithm as Wave, theta)) ** 2;
      }
      return Math.sqrt(sum / FRAMES_PER_TURN);
    }
    const n = this.target.length;
    let sum = 0;
    for (let j = 0; j < n; j++) {
      const tip = last(chainAt(this.terms, (2 * Math.PI * j) / n));
      sum += Math.hypot(tip.x - this.target[j].x, tip.y - this.target[j].y);
    }
    return sum / n;
  }
}
