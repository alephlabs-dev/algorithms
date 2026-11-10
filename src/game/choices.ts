import { localized } from "@/i18n";
import { seededRandom } from "@/utils/random";

// Its own module so each algorithm's question builder can use it without importing questions.ts at runtime.

/** How an explanation opens: "Right", or the answer when the guess missed. */
export const verdict = localized({
  en: { right: "Right", its: (answer: number) => `It's ${answer}` },
  es: { right: "Correcto", its: (answer) => `Es ${answer}` },
});

/** Up to four numbers around `answer`, from `near` first, all different, in order. */
export const choicesAround = (answer: number, near: number[], min = 0, max = Infinity) => {
  const picks = new Set<number>([answer]);
  for (const v of [...near, answer + 1, answer - 1, answer + 2, answer - 2, answer + 3])
    if (picks.size < 4 && v >= min && v <= max) picks.add(v);
  return [...picks].sort((a, b) => a - b);
};

/**
 * For when the answer is always the smallest or largest option, so sorted buttons
 * would give it away. Shuffle them instead, seeded by the run's values and the frame,
 * so the same run always shows the same order.
 */
export const shuffled = (options: number[], run: { values: readonly number[] }, at: number) => {
  let seed = at;
  for (const v of run.values) seed = Math.imul(seed ^ v, 0x9e3779b1) >>> 0;
  const random = seededRandom(seed);
  const out = [...options];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
