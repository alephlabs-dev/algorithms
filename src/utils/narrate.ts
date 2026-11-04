import type { Timeline } from "@/algorithms";

const compareWord = (a: number, b: number) => (a < b ? "smaller" : a > b ? "bigger" : "equal");

/**
 * One plain-language sentence for what happened in the step that led to
 * frame `index`, built from the step itself and the array just before it.
 */
export const narrate = (timeline: Timeline, index: number, lines: string[]): string => {
  const step = timeline.stepAt(index);
  if (!step) return "Press play to start, or step through it one move at a time.";
  if (step.type === "finish") return "Sorted! Every value is in its final place.";

  const before = timeline.frameAt(index - 1);
  const frame = timeline.frameAt(index);
  const valueAt = (position: number) => timeline.values[before.order[position]];

  switch (step.type) {
    case "compare": {
      const a = valueAt(step.i);
      const b = valueAt(step.j);
      const pivot = before.pivot;
      if (pivot !== null && before.order[step.j] === pivot && before.order[step.i] !== pivot) {
        const word = compareWord(a, b);
        return `Compare ${a} with the pivot ${b}: it's ${word === "equal" ? "the same" : word}.`;
      }
      if (a === b) return `Compare ${a} and ${b}: they're equal.`;
      return `Compare ${a} and ${b}: ${Math.min(a, b)} is smaller.`;
    }
    case "swap":
      if (step.i === step.j) return `${valueAt(step.i)} stays where it is.`;
      return `Swap ${valueAt(step.i)} and ${valueAt(step.j)}.`;
    case "move": {
      const value = valueAt(step.from);
      if (step.from === step.to) return `Write ${value} at position ${step.to + 1}.`;
      return `Move ${value} to position ${step.to + 1}.`;
    }
    case "done": {
      const values = step.indices.map((p) => timeline.values[frame.order[p]]);
      if (values.length === 1) return `${values[0]} is now in its final place.`;
      return `${values.length} values are now in their final place.`;
    }
    case "highlight": {
      if (frame.pivot !== null && frame.pivot !== before.pivot) {
        return `Pick ${timeline.values[frame.pivot]} as the pivot.`;
      }
      if (step.focus && step.focus.length > 1) {
        return `Work on positions ${Math.min(...step.focus) + 1} to ${Math.max(...step.focus) + 1}.`;
      }
      const line = frame.line;
      return line !== null ? `Next: ${lines[line].trim()}` : "";
    }
  }
};
