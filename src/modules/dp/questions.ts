import type { Question } from "@/game";
import { choicesAround, verdict } from "@/game/choices";
import { localized } from "@/i18n";
import { narrateDp } from "./narrate";
import { KnapsackRun } from "./knapsack";
import type { TableRun } from "./types";

const text = localized({
  en: {
    corner: "The corner: what's the answer?",
    bestValue: (room: number) => `Best value with room ${room}?`,
    cell: "What goes in this cell?",
  },
  es: {
    corner: "La esquina: ¿cuál es la respuesta?",
    bestValue: (room) => `¿Mejor valor con capacidad ${room}?`,
    cell: "¿Qué va en esta celda?",
  },
});

/**
 * Dynamic programming: a cell's value, before it's filled. Every third cell
 * (and the corner, the answer), so the run is a game and not an exam.
 */
export const dpQuestions = (run: TableRun): Question[] => {
  const questions: Question[] = [];
  let count = 0;
  const cells = run.frames.filter((f) => f.event.type === "cell").length;
  run.frames.forEach((frame, at) => {
    const e = frame.event;
    if (e.type !== "cell") return;
    count++;
    const corner = count === cells;
    if (count % 3 !== 2 && !corner) return;
    const near = e.options.map((o) => o.value);
    const knapsack = run instanceof KnapsackRun;
    questions.push({
      kind: "choice",
      at,
      run,
      cell: { i: e.i, j: e.j },
      prompt: corner ? text.corner : knapsack ? text.bestValue(e.j) : text.cell,
      options: choicesAround(e.value, near, 0),
      answer: e.value,
      explain: (right) => `${right ? verdict.right : verdict.its(e.value)}. ${narrateDp(run, at)}`,
    });
  });
  return questions;
};
