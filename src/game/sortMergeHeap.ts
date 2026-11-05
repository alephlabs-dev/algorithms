import type { Timeline } from "@/algorithms/timeline";
import { localized } from "@/i18n";
import { shuffled, verdict } from "./choices";
import type { Question } from "./questions";

const text = localized({
  en: {
    merge: "Merging two runs: which value is placed next?",
    mergeWhy: (answer: number, left: number, right: number) =>
      left === right
        ? `both runs start with ${answer}, and the left one's goes first, which keeps equal values in order.`
        : `the runs start with ${left} and ${right}, and the smaller front goes next.`,
    sift: (own: number) => `Sifting ${own} down: which child does it swap with, or does it stay?`,
    stays: (own: number) => `${own} stays`,
    itStays: "It stays",
    siftWhy: (stays: boolean, answer: number, own: number) =>
      stays
        ? `no child is bigger than ${own}, so it's where it belongs.`
        : `${answer} is the bigger child and bigger than ${own}, so they swap.`,
  },
  es: {
    merge: "Al mezclar dos tramos: ¿qué valor va ahora?",
    mergeWhy: (answer, left, right) =>
      left === right
        ? `los dos tramos empiezan con ${answer} y va primero el de la izquierda, así los valores iguales mantienen su orden.`
        : `los tramos empiezan con ${left} y ${right}, y va primero el menor.`,
    sift: (own) => `${own} baja: ¿con qué hijo se intercambia, o se queda?`,
    stays: (own) => `${own} se queda`,
    itStays: "Se queda",
    siftWhy: (stays, answer, own) =>
      stays
        ? `ningún hijo es mayor que ${own}, así que está donde debe.`
        : `${answer} es el hijo mayor y es mayor que ${own}, así que se intercambian.`,
  },
});

/**
 * Merge sort: which value a merge places next. A placement is a decision while
 * both runs still have values (the merge compares their fronts); once one run
 * is empty the rest of the other just follows, so those don't count. Every
 * third decision (the 2nd, 5th, 8th…), counted over the whole run so small
 * merges get some too.
 */
export const mergeQuestions = (run: Timeline): Question[] => {
  const questions: Question[] = [];
  let decisions = 0;
  for (let f = 1; f < run.length; f++) {
    const step = run.stepAt(f);
    if (step?.type !== "compare" || decisions++ % 3 !== 1) continue;
    const place = run.stepAt(f + 1);
    if (place?.type !== "move") continue;
    // The merge's range is in focus: what's merged so far, then the left run from i, then the right run from j.
    const shown = run.frameAt(f - 1);
    const end = Math.max(...shown.focus.map((id) => shown.order.indexOf(id))) + 1;
    const leftFront = run.values[shown.order[step.i]];
    const rightFront = run.values[shown.order[step.j]];
    const runs = shown.order.slice(step.i, end);
    // The two fronts, then the smallest of the rest of the runs: the closest misses.
    const rest = shown.order
      .slice(step.i + 1, step.j)
      .concat(shown.order.slice(step.j + 1, end))
      .map((id) => run.values[id])
      .sort((a, b) => a - b);
    const offered = [...new Set([leftFront, rightFront, ...rest])].slice(0, 4);
    // Every value left is the same: nothing to tell apart.
    if (offered.length < 2) continue;
    // What the run places next, read from the step that places it.
    const answer = run.values[run.frameAt(f).order[place.from]];
    questions.push({
      kind: "choice",
      // Asked before the fronts' comparison, whose narration says which is smaller.
      at: f,
      run,
      prompt: text.merge,
      // The answer is always the smallest option, so the buttons are shuffled.
      options: shuffled(offered, run, f),
      answer,
      // Every bar in the two runs holding an offered value, so ties can be found too.
      labels: runs.filter((id) => offered.includes(run.values[id])),
      explain: (right) =>
        `${right ? verdict.right : verdict.its(answer)}: ${text.mergeWhy(answer, leftFront, rightFront)}`,
    });
  }
  return questions;
};

/**
 * Heap sort: during a sift-down, which child the node swaps with, or whether
 * it stays. Only for nodes with two children (with one, there's no choosing),
 * and every third of those (the 2nd, 5th, 8th…), so a run isn't a question per step.
 */
export const heapQuestions = (run: Timeline): Question[] => {
  const questions: Question[] = [];
  let steps = 0;
  for (let f = 1; f + 2 < run.length; f++) {
    const step = run.stepAt(f);
    const versus = run.stepAt(f + 1);
    // Two children: they're compared with each other, then the larger one with the node.
    if (step?.type !== "compare" || versus?.type !== "compare" || steps++ % 3 !== 1) continue;
    const shown = run.frameAt(f - 1);
    const node = shown.order[versus.j];
    const children = [shown.order[step.i], shown.order[step.j]];
    const own = run.values[node];
    // A child as big as the node never swaps, so that value can only mean staying.
    const childValues = [...new Set(children.map((id) => run.values[id]))].filter((v) => v !== own);
    if (childValues.length === 0) continue;
    // What the run does next: swap the node with the larger child, or stop.
    const next = run.stepAt(f + 2);
    const answer = next?.type === "swap" ? run.values[run.frameAt(f + 1).order[next.j]] : own;
    const stays = answer === own;
    questions.push({
      kind: "choice",
      // Asked before the children are compared: the narration of the comparisons gives it away.
      at: f,
      run,
      prompt: text.sift(own),
      // In the order the bars appear, then staying: the answer's spot varies on its own.
      options: [...childValues, own],
      optionLabels: [...childValues.map(String), text.stays(own)],
      answer,
      labels: [node, ...children],
      explain: (right) =>
        `${right ? verdict.right : stays ? text.itStays : verdict.its(answer)}: ${text.siftWhy(stays, answer, own)}`,
    });
  }
  return questions;
};
