import type { Timeline } from "@/algorithms/timeline";
import { seededRandom } from "@/utils/random";
import type { Question } from "./questions";

/** Which end of what's left a pass fills: the front with the smallest value, the back with the largest. */
type End = "front" | "back";

/**
 * The answer is always the smallest or largest option, so sorted buttons would
 * give it away. Shuffle them instead, seeded by the run's values and the frame,
 * so the same run always shows the same order.
 */
const shuffled = (options: number[], run: Timeline, at: number) => {
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

/**
 * Selection, bubble and cocktail work in passes, each one putting a single value
 * in its final place. A pass opens with a comparison right after the previous
 * place was marked done (or at the very start); its running highlights would
 * give the answer away, so the question comes just before that first comparison.
 */
const passQuestions = (
  run: Timeline,
  ends: (pass: number) => End,
  ask: (end: End) => { prompt: string; why: (value: number) => string },
): Question[] => {
  const starts: number[] = [];
  for (let f = 1; f < run.length; f++) {
    const opens = f === 1 || run.stepAt(f - 1)?.type === "done";
    if (opens && run.stepAt(f)?.type === "compare") starts.push(f);
  }
  return starts.flatMap((start, k): Question[] => {
    const shown = run.frameAt(start - 1);
    const done = new Set(shown.done);
    const inPlay = shown.order.flatMap((id, position) => (done.has(id) ? [] : [{ id, position }]));
    const values = [...new Set(inPlay.map(({ id }) => run.values[id]))];
    // All the same value: nothing to tell apart.
    if (values.length < 2) return [];

    // The answer is whatever the run has put at that end once the pass is over.
    const end = ends(k);
    const positions = inPlay.map(({ position }) => position);
    const target = end === "front" ? Math.min(...positions) : Math.max(...positions);
    const passEnd = k + 1 < starts.length ? starts[k + 1] - 1 : run.length - 1;
    const answer = run.values[run.frameAt(passEnd).order[target]];

    // The nearest values still in play make the closest misses.
    const nearest = values.sort((a, b) => Math.abs(a - answer) - Math.abs(b - answer) || a - b).slice(0, 4);
    const options = shuffled(nearest, run, start);
    const { prompt, why } = ask(end);
    return [
      {
        kind: "choice",
        at: start,
        run,
        prompt,
        options,
        answer,
        // Every bar holding an offered value, so ties can be found too.
        labels: inPlay.filter(({ id }) => options.includes(run.values[id])).map(({ id }) => id),
        explain: (right) => `${right ? "Right" : `It's ${answer}`}: ${why(answer)}`,
      },
    ];
  });
};

/** Selection sort: which value the pass picks for the next place (the smallest left). */
export const selectionQuestions = (run: Timeline) =>
  passQuestions(
    run,
    () => "front",
    () => ({
      prompt: "Which value goes into the next place?",
      why: (v) => `${v} is the smallest value left, so the pass picks it for the front of what's left.`,
    }),
  );

/** Bubble sort: which value the pass carries to the end (the largest left). */
export const bubbleQuestions = (run: Timeline) =>
  passQuestions(
    run,
    () => "back",
    () => ({
      prompt: "Which value reaches the end of this pass?",
      why: (v) => `${v} is the largest value left, so every comparison carries it one step right.`,
    }),
  );

/** Cocktail sort: bubble's question both ways, the largest going right, then the smallest going left. */
export const cocktailQuestions = (run: Timeline) =>
  passQuestions(
    run,
    (pass) => (pass % 2 === 0 ? "back" : "front"),
    (end) =>
      end === "back"
        ? {
            prompt: "Going right: which value reaches the end?",
            why: (v) => `${v} is the largest value left, so every comparison carries it one step right.`,
          }
        : {
            prompt: "Going left: which value reaches the start?",
            why: (v) => `${v} is the smallest value left, so every comparison carries it one step left.`,
          },
  );
