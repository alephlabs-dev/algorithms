import { alignment, itemName, keptLetters, KnapsackRun, takenItems, type DpRun, type TableRun } from "@/dp";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const NAMES = { diag: "diagonal", up: "up", left: "left" } as const;
const EDIT_NAMES = { diag: "replace", up: "delete", left: "insert" } as const;

/** The step into frame `index`, in one or two plain sentences. */
export const narrateDp = (run: TableRun, index: number): string =>
  run instanceof KnapsackRun ? narrateKnapsack(run, index) : narrateWords(run as DpRun, index);

const narrateKnapsack = (run: KnapsackRun, index: number): string => {
  const { items, capacity } = run;
  const frame = run.frames[index];
  const e = frame.event;
  const label = (k: number) => `${itemName(k)} (weight ${items[k].weight}, worth ${items[k].value})`;
  switch (e.type) {
    case "start":
      return `What's the most value that fits in a bag of ${capacity}? Each cell answers it for the first few items and a smaller bag. Press play.`;
    case "base":
      return "Row 0 first: with no items to choose from, any bag is worth 0.";
    case "cell": {
      const k = e.i - 1;
      const [leave, take] = e.options;
      if (!take) return `${label(k)} doesn't fit in room ${e.j}: leave it, and keep ${leave.value} from the row above.`;
      if (e.pick === "take")
        return `Room ${e.j}: take ${itemName(k)}, ${take.value - items[k].value} + ${items[k].value} = ${take.value}, beats leaving it (${leave.value}).`;
      return `Room ${e.j}: taking ${itemName(k)} gets ${take.value}, no better than leaving it (${leave.value}). Leave it.`;
    }
    case "trace": {
      const k = e.step.i - 1;
      return e.step.kind === "take"
        ? `Different from the cell above: ${label(k)} is in the bag. Go up and ${items[k].weight} left.`
        : `Same as the cell above: ${itemName(k)} stays out. Go up.`;
    }
    case "done": {
      const chosen = takenItems(run.trace);
      const weight = chosen.reduce((sum, k) => sum + items[k].weight, 0);
      return chosen.length
        ? `Take ${chosen.map(itemName).join(", ")}: worth ${e.answer}, weighing ${weight} of ${capacity}.`
        : `Nothing fits in a bag of ${capacity}.`;
    }
  }
};

const narrateWords = (run: DpRun, index: number): string => {
  const { a, b } = run;
  const frame = run.frames[index];
  const e = frame.event;
  const edit = run.algorithm === "edit";
  switch (e.type) {
    case "start":
      return edit
        ? `How many edits turn ${a} into ${b}? Each cell answers that for the first i letters of ${a} and the first j of ${b}. Press play.`
        : `What's the longest run of letters ${a} and ${b} share, in order? Each cell answers that for a prefix of each. Press play.`;
    case "base":
      return edit
        ? "Row and column ε first: turning letters into nothing takes one delete each, and nothing into letters one insert each."
        : "Row and column ε first: a word shares nothing with an empty one, so they're all 0.";
    case "cell": {
      const x = a[e.i - 1];
      const y = b[e.j - 1];
      if (edit) {
        if (e.match) return `${x} = ${y}: no edit needed, so it costs what the diagonal does: ${e.value}.`;
        const name = (w: string) => EDIT_NAMES[w as keyof typeof EDIT_NAMES];
        const options = e.options.map((o) => `${name(o.from)} ${o.value}`).join(", ");
        return `${x} ≠ ${y}: the cheapest of ${options} is ${e.value}, by ${name(e.pick)}.`;
      }
      if (e.match) return `${x} = ${y}: one more shared letter than the diagonal, ${e.value - 1} + 1 = ${e.value}.`;
      const [up, left] = e.options;
      return `${x} ≠ ${y}: the better of up (${up.value}) and left (${left.value}) is ${e.value}.`;
    }
    case "trace": {
      const s = e.step;
      const x = a[s.i - 1];
      const y = b[s.j - 1];
      switch (s.kind) {
        case "match":
          return `${x} = ${y}: keep it, and go diagonally.`;
        case "replace":
          return `Came from the diagonal plus one: replace ${x} with ${y}.`;
        case "delete":
          return `Came from above plus one: delete ${x}.`;
        case "insert":
          return `Came from the left plus one: insert ${y}.`;
        case "keep":
          return `${x} = ${y}: it's one of the shared letters. Go diagonally.`;
        case "skip":
          return `${x} ≠ ${y}: go ${NAMES[s.move as keyof typeof NAMES]}, toward the bigger value.`;
      }
      return "";
    }
    case "done": {
      if (edit) {
        const edits = alignment(a, b, run.trace).filter((c) => c.kind !== "match").length;
        return e.answer === 0
          ? `${a} and ${b} are the same word: distance 0.`
          : `${a} → ${b} in ${plural(edits, "edit")}: the corner's ${e.answer}. Shown under the table: replaced, deleted and inserted letters.`;
      }
      const letters = keptLetters(a, run.trace);
      return e.answer === 0
        ? `${a} and ${b} share no letters at all.`
        : `The longest common subsequence is ${letters}: ${plural(e.answer, "letter")}, in order in both words.`;
    }
  }
};
