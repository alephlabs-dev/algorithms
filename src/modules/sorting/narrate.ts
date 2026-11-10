import type { Timeline } from "./timeline";
import { localized } from "@/i18n";

type Comparison = "smaller" | "bigger" | "equal";

const text = localized({
  en: {
    start: "Press play to start, or step through it one move at a time.",
    finish: "Sorted! Every value is in its final place.",
    compareWithPivot: (a: number, pivot: number, word: Comparison) =>
      `Compare ${a} with the pivot ${pivot}: it's ${word === "equal" ? "the same" : word}.`,
    compareEqual: (a: number, b: number) => `Compare ${a} and ${b}: they're equal.`,
    compare: (a: number, b: number, smaller: number) => `Compare ${a} and ${b}: ${smaller} is smaller.`,
    stays: (value: number) => `${value} stays where it is.`,
    swap: (a: number, b: number) => `Swap ${a} and ${b}.`,
    write: (value: number, position: number) => `Write ${value} at position ${position}.`,
    move: (value: number, position: number) => `Move ${value} to position ${position}.`,
    doneOne: (value: number) => `${value} is now in its final place.`,
    doneMany: (count: number) => `${count} values are now in their final place.`,
    pivot: (value: number) => `Pick ${value} as the pivot.`,
    range: (from: number, to: number) => `Work on positions ${from} to ${to}.`,
    next: (line: string) => `Next: ${line}`,
  },
  es: {
    start: "Presiona play para empezar, o avanza paso a paso.",
    finish: "¡Ordenado! Cada valor está en su lugar final.",
    compareWithPivot: (a, pivot, word) =>
      `Compara ${a} con el pivote ${pivot}: ${word === "equal" ? "es igual" : word === "smaller" ? "es menor" : "es mayor"}.`,
    compareEqual: (a, b) => `Compara ${a} y ${b}: son iguales.`,
    compare: (a, b, smaller) => `Compara ${a} y ${b}: ${smaller} es menor.`,
    stays: (value) => `${value} se queda donde está.`,
    swap: (a, b) => `Intercambia ${a} y ${b}.`,
    write: (value, position) => `Escribe ${value} en la posición ${position}.`,
    move: (value, position) => `Mueve ${value} a la posición ${position}.`,
    doneOne: (value) => `${value} ya está en su lugar final.`,
    doneMany: (count) => `${count} valores ya están en su lugar final.`,
    pivot: (value) => `Elige ${value} como pivote.`,
    range: (from, to) => `Trabaja en las posiciones ${from} a ${to}.`,
    next: (line) => `Siguiente: ${line}`,
  },
});

const compareWord = (a: number, b: number): Comparison => (a < b ? "smaller" : a > b ? "bigger" : "equal");

/**
 * One plain-language sentence for what happened in the step that led to
 * frame `index`, built from the step itself and the array just before it.
 */
export const narrate = (timeline: Timeline, index: number, lines: string[]): string => {
  const step = timeline.stepAt(index);
  if (!step) return text.start;
  if (step.type === "finish") return text.finish;

  const before = timeline.frameAt(index - 1);
  const frame = timeline.frameAt(index);
  const valueAt = (position: number) => timeline.values[before.order[position]];

  switch (step.type) {
    case "compare": {
      const a = valueAt(step.i);
      const b = valueAt(step.j);
      const pivot = before.pivot;
      if (pivot !== null && before.order[step.j] === pivot && before.order[step.i] !== pivot) {
        return text.compareWithPivot(a, b, compareWord(a, b));
      }
      if (a === b) return text.compareEqual(a, b);
      return text.compare(a, b, Math.min(a, b));
    }
    case "swap":
      if (step.i === step.j) return text.stays(valueAt(step.i));
      return text.swap(valueAt(step.i), valueAt(step.j));
    case "move": {
      const value = valueAt(step.from);
      if (step.from === step.to) return text.write(value, step.to + 1);
      return text.move(value, step.to + 1);
    }
    case "done": {
      const values = step.indices.map((p) => timeline.values[frame.order[p]]);
      if (values.length === 1) return text.doneOne(values[0]);
      return text.doneMany(values.length);
    }
    case "highlight": {
      if (frame.pivot !== null && frame.pivot !== before.pivot) {
        return text.pivot(timeline.values[frame.pivot]);
      }
      if (step.focus && step.focus.length > 1) {
        return text.range(Math.min(...step.focus) + 1, Math.max(...step.focus) + 1);
      }
      const line = frame.line;
      return line !== null ? text.next(lines[line].trim()) : "";
    }
  }
};
