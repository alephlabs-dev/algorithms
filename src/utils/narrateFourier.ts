import { fourierSeries } from "@/consts/fourierSeries";
import { circleOptions, FRAMES_PER_TURN, isWave, type FourierRun } from "@/fourier";
import { count } from "./count";

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

/** What the circles are doing at frame `index`, in one or two plain sentences. */
export const narrateFourier = (run: FourierRun, index: number): string => {
  const { algorithm, circles, terms } = run;
  const circlesText = count(circles, "circle");
  const last = index >= run.length - 1;
  const options = circleOptions[isWave(algorithm) ? "wave" : "drawing"];
  const max = options[options.length - 1];
  const more = circles < max ? " Add circles to get closer." : "";

  if (isWave(algorithm)) {
    const name = fourierSeries[algorithm].title.toLowerCase();
    if (index === 0) {
      return circles === 1
        ? `One circle: its height is a plain sine. Press play, then add circles to build the ${name}.`
        : `${circlesText}, each turning faster and smaller than the last, on the tip of the one before. Press play to build the ${name}.`;
    }
    if (last) return `Two turns: ${circlesText} trace the ${name}, off by ${percent(run.error)} on average.${more}`;
    const { value, target, theta } = run.frameAt(index);
    const degrees = Math.round(((theta * 180) / Math.PI) % 360);
    // The Gibbs overshoot: sums of smooth waves always ring past a jump.
    const overshoot =
      algorithm !== "triangle" && Math.abs(value) > 1.02 ? " That bump past 1 is the overshoot at the jump." : "";
    return `At ${degrees}°, the circles add up to ${value.toFixed(2)}; the ${name} is ${target.toFixed(2)}.${overshoot}`;
  }

  if (index === 0) {
    return `The ${circlesText} the drawing needs most, biggest first. Press play: in one turn their tip retraces it.`;
  }
  if (last) {
    return circles >= terms.length && circles === max
      ? `All ${circles} circles: the drawing comes back exactly, point for point.`
      : `One turn: the ${circlesText} retraced the drawing, off by ${percent(run.error)} of its size on average.${more}`;
  }
  const j = Math.round((index / FRAMES_PER_TURN) * run.target.length) % run.target.length;
  const tip = run.tips[index];
  const gap = Math.hypot(tip.x - run.target[j].x, tip.y - run.target[j].y);
  return `${Math.round((index / FRAMES_PER_TURN) * 100)}% of the way round, the tip is ${percent(gap)} of the drawing's size away from it.`;
};
