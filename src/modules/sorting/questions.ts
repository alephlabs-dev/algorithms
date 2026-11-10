import type { Question } from "@/game";
import { choicesAround, verdict } from "@/game/choices";
import { heapQuestions, mergeQuestions } from "./sortMergeHeap";
import { quickQuestions, shellQuestions } from "./sortPartitions";
import { bubbleQuestions, cocktailQuestions, selectionQuestions } from "./sortPasses";
import { radixQuestions } from "./sortRadix";
import { localized } from "@/i18n";
import type { Algorithm } from "./types";
import type { Timeline } from "./timeline";

const text = localized({
  en: {
    slides: (value: number) => `${value} joins the sorted part. How many places does it move left?`,
    slidesWhy: (value: number, moves: number) =>
      moves === 0
        ? `${value} is already at least as big as the value before it.`
        : `${value} slides past ${moves} bigger value${moves === 1 ? "" : "s"}.`,
  },
  es: {
    slides: (value) => `${value} entra en la parte ordenada. ¿Cuántos lugares se mueve a la izquierda?`,
    slidesWhy: (value, moves) =>
      moves === 0
        ? `${value} ya es al menos tan grande como el valor anterior.`
        : `${value} se desliza más allá de ${moves === 1 ? "1 valor mayor" : `${moves} valores mayores`}.`,
  },
});

/** Insertion sort: how many places each picked-up value moves left. */
const insertionQuestions = (run: Timeline): Question[] => {
  // Each pass opens with a highlight of the sorted part plus the value it picks up.
  const passes: number[] = [];
  for (let f = 1; f < run.length; f++) if (run.stepAt(f)?.type === "highlight") passes.push(f);
  return passes.map((lit, k) => {
    const step = run.stepAt(lit);
    const picked = (step?.type === "highlight" ? (step.temp?.length ?? 1) : 1) - 1;
    const end = k + 1 < passes.length ? passes[k + 1] : run.length - 1;
    let moves = 0;
    for (let f = lit + 1; f <= end; f++) if (run.stepAt(f)?.type === "swap") moves++;
    const value = run.valuesAt(lit)[picked];
    return {
      kind: "choice",
      // Asked with the pass lit on screen, before its first comparison.
      at: lit + 1,
      run,
      prompt: text.slides(value),
      options: choicesAround(moves, [], 0, picked),
      answer: moves,
      labels: [run.frameAt(lit).order[picked]],
      explain: (right) => `${right ? verdict.right : verdict.its(moves)}: ${text.slidesWhy(value, moves)}`,
    };
  });
};

/** Each sorting algorithm's key-moment questions; one entry per algorithm. */
const sortBuilders: Partial<Record<Algorithm, (run: Timeline) => Question[]>> = {
  selection: selectionQuestions,
  insertion: insertionQuestions,
  bubble: bubbleQuestions,
  cocktail: cocktailQuestions,
  shell: shellQuestions,
  quick: quickQuestions,
  merge: mergeQuestions,
  heap: heapQuestions,
  radix: radixQuestions,
};

/** Sorting: each algorithm asks about its key moment. Algorithms without one yet ask nothing. */
export const sortQuestions = (run: Timeline, algorithm: Algorithm): Question[] =>
  sortBuilders[algorithm]?.(run) ?? [];

