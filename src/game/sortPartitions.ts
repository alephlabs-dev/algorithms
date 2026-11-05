import type { Timeline } from "@/algorithms/timeline";
import { localized } from "@/i18n";
import { choicesAround, verdict } from "./choices";
import type { Question } from "./questions";

const text = localized({
  en: {
    quick: (value: number) => `How many values in this partition are smaller than the pivot, ${value}?`,
    quickWhy: (value: number, smaller: number) =>
      smaller === 0
        ? `nothing here is smaller than ${value}, so it lands first in this partition.`
        : `${smaller} value${smaller === 1 ? " goes" : "s go"} before ${value}, so it lands right after ${smaller === 1 ? "it" : "them"}.`,
    shell: (gap: number, value: number) => `Gap ${gap}: how many gap-steps does ${value} move back?`,
    shellWhy: (gap: number, value: number, moves: number) =>
      moves === 0
        ? `the value ${gap} places before ${value} is no bigger, so it stays.`
        : `${value} jumps back ${gap} places at a time, past ${moves} bigger value${moves === 1 ? "" : "s"} in its group.`,
  },
  es: {
    quick: (value) => `¿Cuántos valores de esta partición son menores que el pivote, ${value}?`,
    quickWhy: (value, smaller) =>
      smaller === 0
        ? `aquí nada es menor que ${value}, así que queda primero en esta partición.`
        : `${smaller === 1 ? "1 valor va" : `${smaller} valores van`} antes de ${value}, así que queda justo después.`,
    shell: (gap, value) => `Salto ${gap}: ¿cuántos saltos retrocede ${value}?`,
    shellWhy: (gap, value, moves) =>
      moves === 0
        ? `el valor ${gap} lugares antes de ${value} no es mayor, así que se queda.`
        : `${value} retrocede de ${gap} en ${gap} lugares y pasa ${moves === 1 ? "1 valor mayor" : `${moves} valores mayores`} de su grupo.`,
  },
});

/**
 * Quick sort: how many values in a partition are smaller than its pivot, which
 * is where the pivot lands. A partition opens by marking its pivot; a pivot is
 * only marked for partitions with more than one element.
 */
export const quickQuestions = (run: Timeline): Question[] => {
  const questions: Question[] = [];
  for (let lit = 1; lit < run.length; lit++) {
    const step = run.stepAt(lit);
    if (step?.type !== "highlight" || typeof step.pivot !== "number") continue;
    const shown = run.frameAt(lit);
    const pivot = shown.pivot!;
    const lo = Math.min(...shown.focus.map((id) => shown.order.indexOf(id)));
    const size = shown.focus.length;
    // The pivot stays marked until it's in its final place.
    let placed = lit + 1;
    while (placed < run.length - 1 && run.frameAt(placed).pivot === pivot) placed++;
    const smaller = run.frameAt(placed).order.indexOf(pivot) - lo;
    const value = run.values[pivot];
    questions.push({
      kind: "choice",
      // Asked with the partition lit and its pivot marked, before the first comparison.
      at: lit + 1,
      run,
      prompt: text.quick(value),
      options: choicesAround(smaller, [], 0, size - 1),
      answer: smaller,
      labels: [pivot],
      explain: (right) => `${right ? verdict.right : verdict.its(smaller)}: ${text.quickWhy(value, smaller)}`,
    });
  }
  return questions;
};

/**
 * Shell sort: how many gap-steps a picked-up value moves back. Asked for every
 * other pick-up in the passes with a gap bigger than 1; the last pass is plain
 * insertion sort.
 */
export const shellQuestions = (run: Timeline): Question[] => {
  // A value is picked up when its gap group lights up for its first comparison.
  const pickups: number[] = [];
  for (let f = 1; f < run.length; f++) {
    const step = run.stepAt(f);
    if (step?.type === "compare" && step.temp !== undefined) pickups.push(f);
  }
  const questions: Question[] = [];
  pickups.forEach((lit, k) => {
    const step = run.stepAt(lit);
    if (step?.type !== "compare") return;
    const gap = step.j - step.i;
    if (gap <= 1) return;
    // A pass picks up the values at gap, gap + 1, …; ask about every other one (the 1st, 3rd, …),
    // so a run isn't a question per value and each pass still gets at least one.
    if ((step.j - gap) % 2 !== 0) return;
    const end = k + 1 < pickups.length ? pickups[k + 1] - 1 : run.length - 1;
    let moves = 0;
    for (let f = lit + 1; f <= end; f++) if (run.stepAt(f)?.type === "swap") moves++;
    const { order, temp } = run.frameAt(lit);
    const picked = order[step.j];
    const value = run.values[picked];
    const behind = Math.floor(step.j / gap);
    questions.push({
      kind: "choice",
      // Asked before the pick-up frame shows: its first comparison's narration says whether it moves.
      at: lit,
      run,
      prompt: text.shell(gap, value),
      options: choicesAround(moves, [], 0, behind),
      answer: moves,
      // The value and the gap group it moves back through, so the bigger ones can be counted.
      labels: temp,
      explain: (right) => `${right ? verdict.right : verdict.its(moves)}: ${text.shellWhy(gap, value, moves)}`,
    });
  });
  return questions;
};
