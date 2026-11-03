/**
 * Critically damped spring towards `target` (the "SmoothDamp" approximation).
 * It never overshoots and keeps its velocity when the target changes mid-way,
 * which is what makes chained moves look continuous.
 *
 * `smoothTime` is roughly the time to cover most of the distance, in seconds.
 * Returns the new value; updates `state.velocity` in place.
 */
export const smoothDamp = (
  current: number,
  target: number,
  state: { velocity: number },
  smoothTime: number,
  dt: number
): number => {
  if (smoothTime <= 0) {
    state.velocity = 0;
    return target;
  }
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - target;
  const temp = (state.velocity + omega * change) * dt;
  state.velocity = (state.velocity - omega * temp) * decay;
  return target + (change + temp) * decay;
};
