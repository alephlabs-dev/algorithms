// Step sentences of representative runs, for e2e/step-sentences-fit.spec.ts (see `sentences` in ../slice.ts).
import { narrateFourier } from "./narrate";
import { circleOptions, FourierRun } from "./run";
import { FOURIER_SHAPES } from "./types";
import type { StepSentence } from "@/modules/slice";

export const sentences = function* (): Generator<StepSentence> {
  // Every drawing but the learner's own, which has no sentences of its own to check.
  const shapes = FOURIER_SHAPES.filter((shape) => shape !== 'custom');
  const waves = (['square', 'sawtooth', 'triangle'] as const).flatMap((algorithm) =>
    circleOptions.wave.map((circles) => ({ run: `fourier ${algorithm} ${circles}`, fourier: new FourierRun(algorithm, circles, 'heart', null) }))
  );
  const drawings = shapes.flatMap((shape) =>
    circleOptions.drawing.map((circles) => ({ run: `fourier epicycles ${shape} ${circles}`, fourier: new FourierRun('epicycles', circles, shape, null) }))
  );
  for (const { run, fourier } of [...waves, ...drawings])
    for (let i = 0; i < fourier.length; i++) yield { run, sentence: narrateFourier(fourier, i) };
};
