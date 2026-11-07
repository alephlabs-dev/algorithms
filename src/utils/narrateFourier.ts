import { fourierSeries } from "@/consts/fourierSeries";
import { circleOptions, FRAMES_PER_TURN, isWave, type FourierRun } from "@/fourier";
import { localized } from "@/i18n";
import { count } from "./count";

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

const text = localized({
  en: {
    circles: (n: number) => count(n, "circle"),
    more: " Add circles to get closer.",
    oneCircle: (named: string) => `One circle: its height is a plain sine. Press play, then add circles to build the ${named}.`,
    manyCircles: (circles: string, named: string) =>
      `${circles} in a chain, each smaller and faster than the last. Press play to build the ${named}.`,
    twoTurns: (circles: string, error: string, more: string) => `Two turns with ${circles}: off by ${error} on average.${more}`,
    at: (degrees: number, value: string, named: string, target: string) =>
      `At ${degrees}°, the circles add up to ${value}; the ${named} is ${target}.`,
    overshoot: (degrees: number, value: string) => `At ${degrees}°, the circles reach ${value}, beyond ±1: the overshoot at the jump.`,
    drawingStart: (circles: string) =>
      `The ${circles} the drawing needs most, biggest first. Press play: in one turn their tip retraces it.`,
    exact: (n: number) => `All ${n} circles: the drawing comes back exactly, point for point.`,
    oneTurn: (circles: string, error: string, more: string) => `One turn with ${circles}: off by ${error} of its size on average.${more}`,
    wayRound: (pct: number, gap: string) => `${pct}% of the way round, the tip is ${gap} of the drawing's size away from it.`,
  },
  es: {
    circles: (n) => `${n} ${n === 1 ? "círculo" : "círculos"}`,
    more: " Agrega círculos para acercarte.",
    oneCircle: (named) => `Un círculo: su altura es un seno simple. Agrega círculos para armar ${named}.`,
    manyCircles: (circles, named) =>
      `${circles} en cadena, cada uno menor y más rápido. Presiona play: arman ${named}.`,
    twoTurns: (circles, error, more) => `Dos vueltas con ${circles}: error promedio de ${error}.${more}`,
    at: (degrees, value, named, target) => `A ${degrees}°, los círculos suman ${value}; ${named} vale ${target}.`,
    overshoot: (degrees, value) => `A ${degrees}°, los círculos llegan a ${value}, más allá de ±1: el exceso en el salto.`,
    drawingStart: (circles) =>
      `Los ${circles} que más necesita el dibujo, de mayor a menor. Presiona play: una vuelta lo traza.`,
    exact: (n) => `Los ${n} círculos: el dibujo vuelve exacto, punto por punto.`,
    oneTurn: (circles, error, more) => `Una vuelta con ${circles}: error medio de ${error} de su tamaño.${more}`,
    wayRound: (pct, gap) => `Al ${pct}% de la vuelta, la punta está a ${gap} del tamaño del dibujo.`,
  },
});

/** What the circles are doing at frame `index`, in one or two plain sentences. */
export const narrateFourier = (run: FourierRun, index: number): string => {
  const { algorithm, circles, terms } = run;
  const circlesText = text.circles(circles);
  const last = index >= run.length - 1;
  const options = circleOptions[isWave(algorithm) ? "wave" : "drawing"];
  const max = options[options.length - 1];
  const more = circles < max ? text.more : "";

  if (isWave(algorithm)) {
    const name = fourierSeries[algorithm].named;
    if (index === 0) return circles === 1 ? text.oneCircle(name) : text.manyCircles(circlesText, name);
    if (last) return text.twoTurns(circlesText, percent(run.error), more);
    const { value, target, theta } = run.frameAt(index);
    const degrees = Math.round(((theta * 180) / Math.PI) % 360);
    // The Gibbs overshoot: sums of smooth waves always ring past a jump.
    if (algorithm !== "triangle" && Math.abs(value) > 1.02) return text.overshoot(degrees, value.toFixed(2));
    return text.at(degrees, value.toFixed(2), name, target.toFixed(2));
  }

  if (index === 0) return text.drawingStart(circlesText);
  if (last) {
    return circles >= terms.length && circles === max ? text.exact(circles) : text.oneTurn(circlesText, percent(run.error), more);
  }
  const j = Math.round((index / FRAMES_PER_TURN) * run.target.length) % run.target.length;
  const tip = run.tips[index];
  const gap = Math.hypot(tip.x - run.target[j].x, tip.y - run.target[j].y);
  return text.wayRound(Math.round((index / FRAMES_PER_TURN) * 100), percent(gap));
};
