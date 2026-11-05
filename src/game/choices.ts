// Its own module so each algorithm's question builder can use it without importing questions.ts at runtime.

/** Up to four numbers around `answer`, from `near` first, all different, in order. */
export const choicesAround = (answer: number, near: number[], min = 0, max = Infinity) => {
  const picks = new Set<number>([answer]);
  for (const v of [...near, answer + 1, answer - 1, answer + 2, answer - 2, answer + 3])
    if (picks.size < 4 && v >= min && v <= max) picks.add(v);
  return [...picks].sort((a, b) => a - b);
};
