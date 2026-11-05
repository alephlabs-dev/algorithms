import type { Question } from "./questions";

export { dpQuestions, sortQuestions, structureQuestions, type Answer, type Question, type Slot } from "./questions";

// Per run, worked out once: a run's frames never change, so neither do its questions.
const questionCache = new WeakMap<object, Question[]>();
export const questionsOf = <R extends object>(run: R, build: (run: R) => Question[]) => {
  let questions = questionCache.get(run);
  if (!questions) questionCache.set(run, (questions = build(run)));
  return questions;
};

// Which questions of a run have been answered, so replaying or stepping back and forth doesn't ask again.
const answered = new WeakMap<object, Set<number>>();
export const isAnswered = (q: Question) => answered.get(q.run)?.has(q.at) ?? false;
export const markAnswered = (q: Question) => {
  const set = answered.get(q.run) ?? new Set<number>();
  set.add(q.at);
  answered.set(q.run, set);
};
export const forgetAnswers = (run: object) => answered.delete(run);

/** Sorting plays guess mode with this many items at most. */
export const SORT_GUESS_MAX_SIZE = 20;

export type GameScore = { asked: number; right: number; streak: number; best: number };
export const NEW_SCORE: GameScore = { asked: 0, right: 0, streak: 0, best: 0 };
