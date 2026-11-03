// The speed slider goes from 0 to 1 on an exponential scale: 1 step per second
// at the left end, ~2000 at the right. That range is what lets the same slider
// work for 10 items and for 400.
const DOUBLINGS = 11;

export const DEFAULT_SPEED = 0.2;

export const stepsPerSecond = (speed: number) => 2 ** (speed * DOUBLINGS);

/** Milliseconds between steps. */
export const stepDelay = (speed: number) => 1000 / stepsPerSecond(speed);

/** Seconds a bar takes to move. Fast speeds snap so the bars don't lag behind. */
export const moveDuration = (speed: number) => {
  const seconds = (stepDelay(speed) / 1000) * 0.85;
  return seconds < 0.02 ? 0 : Math.min(seconds, 0.5);
};

export const formatStepsPerSecond = (speed: number) => {
  const sps = stepsPerSecond(speed);
  return sps < 10 ? sps.toFixed(1) : String(Math.round(sps));
};
