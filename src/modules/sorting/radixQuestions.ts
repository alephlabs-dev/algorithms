import type { Timeline } from "./timeline";
import { localized } from "@/i18n";
import { choicesAround, verdict } from "@/game/choices";
import type { Question } from "@/game/questions";

const text = localized({
  en: {
    /** "ones digit", "tens digit"… */
    digit: (place: number) => `${{ 1: "ones", 10: "tens", 100: "hundreds" }[place] ?? `${place}s`} digit`,
    bucket: (value: number, where: string) => `Which bucket does ${value} go in, by its ${where}?`,
    why: (value: number, where: string, digit: number) => `the ${where} of ${value} is ${digit}.`,
  },
  es: {
    digit: (place) => `dígito de ${{ 1: "las unidades", 10: "las decenas", 100: "las centenas" }[place] ?? `los ${place}`}`,
    bucket: (value, where) => `¿En qué cubeta va ${value}, según su ${where}?`,
    why: (value, where, digit) => `el ${where} de ${value} es ${digit}.`,
  },
});
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
    const where = text.digit(place);
    // The value's other digits are the likeliest wrong answers.
    const others = [1, 10, 100].filter((p) => p !== place && p <= value).map((p) => digitOf(value, p));
    questions.push({
      kind: "choice",
      // Asked just before the frame that moves it into its bucket.
      at: f,
      run,
      prompt: text.bucket(value, where),
      options: choicesAround(digit, others, 0, 9),
      answer: digit,
      labels: [id],
      explain: (right) => `${right ? verdict.right : verdict.its(digit)}: ${text.why(value, where, digit)}`,
    });
  }
  return questions;
};
