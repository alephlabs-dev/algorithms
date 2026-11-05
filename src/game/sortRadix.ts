import type { Timeline } from "@/algorithms/timeline";
import { choicesAround, type Question } from "./questions";

const PLACES: Record<number, string> = { 1: "ones", 10: "tens", 100: "hundreds" };
const digitOf = (value: number, place: number) => Math.floor(value / place) % 10;

/**
 * Radix sort never compares two values: it asks which bucket (digit) a value
 * goes in. Every third value each digit pass moves, in the order it moves them.
 */
export const radixQuestions = (run: Timeline): Question[] => {
  const questions: Question[] = [];
  let place = 0;
  let moved = 0;
  for (let f = 1; f < run.length; f++) {
    const step = run.stepAt(f);
    if (!step || step.type === "finish") continue;
    // Each pass opens with a step that names its place value.
    if (step.place !== undefined) {
      place = step.place;
      moved = 0;
    }
    if (step.type !== "move" || !place || moved++ % 3 !== 1) continue;
    const id = run.frameAt(f - 1).order[step.from];
    const value = run.values[id];
    const digit = digitOf(value, place);
    const where = `${PLACES[place] ?? `${place}s`} digit`;
    // The value's other digits are the likeliest wrong answers.
    const others = [1, 10, 100].filter((p) => p !== place && p <= value).map((p) => digitOf(value, p));
    questions.push({
      kind: "choice",
      // Asked just before the frame that moves it into its bucket.
      at: f,
      run,
      prompt: `Which bucket does ${value} go in, by its ${where}?`,
      options: choicesAround(digit, others, 0, 9),
      answer: digit,
      labels: [id],
      explain: (right) => `${right ? "Right" : `It's ${digit}`}: the ${where} of ${value} is ${digit}.`,
    });
  }
  return questions;
};
