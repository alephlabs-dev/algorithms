import type { View } from "@/appStore";
import {
  decodeItems,
  DpRun,
  encodeItems,
  EXAMPLE_CAPACITY,
  EXAMPLE_ITEMS,
  KnapsackRun,
  KnapsackWork,
  methods,
  RACE_CAPACITY,
  RACE_ITEMS,
  randomItems,
  wordPairs,
  type DpAlgorithm,
  type DpEvent,
  type Item,
  type TableRun,
} from "@/dp";
import { dpQuestions, questionsOf } from "@/game";
import { toDpSearch } from "@/urlState";
import { newSeed, seededRandom } from "@/utils/random";
import { defineModule } from "./slice";

export type DpState = {
  algorithm: DpAlgorithm;
  /** The two words: down the side, and across the top. */
  a: string;
  b: string;
  /** Knapsack: the items (named A, B, C… in order) and the bag's capacity. */
  items: Item[];
  capacity: number;
  /** The table being filled, precomputed. */
  run: TableRun;
  /** Race view: the knapsack solved three ways, every subproblem each one touches. */
  raceRuns: KnapsackWork[];
};

/** The table for a problem: two words, or a knapsack. */
const runFor = (s: Pick<DpState, "algorithm" | "a" | "b" | "items" | "capacity">): TableRun =>
  s.algorithm === "knapsack" ? new KnapsackRun(s.items, s.capacity) : new DpRun(s.algorithm, s.a, s.b);

const raceRunsFor = (view: View, items: Item[], capacity: number) =>
  view === "race" ? methods.map((m) => new KnapsackWork(m, items, capacity)) : [];

const isTextbookBag = (items: Item[], capacity: number) =>
  capacity === EXAMPLE_CAPACITY && encodeItems(items) === encodeItems(EXAMPLE_ITEMS);

/** Cells fill briskly; the way back, the part that answers the question, gets a longer beat. */
const STEP_WEIGHT: Record<DpEvent["type"], number> = {
  start: 0.7,
  base: 1.2,
  cell: 0.8,
  trace: 1.4,
  done: 0.5,
};

export const dpSlice = defineModule<DpState, DpAlgorithm>()({
  tourKey: "tour-done-dp",

  hydrate: (link, ctx) => {
    // The race opens on its own example, big enough for plain recursion to show its repeats.
    const race = ctx.view === "race";
    const settings = {
      algorithm: link.dpAlgorithm ?? "edit",
      a: link.dp.a ?? wordPairs[0].a,
      b: link.dp.b ?? wordPairs[0].b,
      items: (link.dp.items && decodeItems(link.dp.items)) || (race ? RACE_ITEMS : EXAMPLE_ITEMS),
      capacity: link.dp.capacity ?? (race ? RACE_CAPACITY : EXAMPLE_CAPACITY),
    };
    return { ...settings, run: runFor(settings), raceRuns: raceRunsFor(ctx.view, settings.items, settings.capacity) };
  },

  current: (s) => s.algorithm,

  pick: (s, _, algorithm) => ({ algorithm, run: runFor({ ...s, algorithm }) }),

  actions: {
    /** New words (already cleaned up); the table starts over. */
    setWords: (s, _, a: string, b: string) => ({ a, b, run: runFor({ ...s, a, b }) }),
    /** New knapsack items and capacity; the table starts over. */
    setItems: (s, ctx, items: Item[], capacity: number) => ({
      items,
      capacity,
      run: runFor({ ...s, items, capacity }),
      raceRuns: raceRunsFor(ctx.view, items, capacity),
    }),
  },

  /**
   * The race's runs and, coming from the four-item textbook bag (too small for
   * recursion to repeat itself), the race's own example.
   */
  forView: (s, ctx) => {
    if (!(ctx.view === "race" && isTextbookBag(s.items, s.capacity))) {
      return { raceRuns: raceRunsFor(ctx.view, s.items, s.capacity) };
    }
    const items = RACE_ITEMS;
    const capacity = RACE_CAPACITY;
    return {
      items,
      capacity,
      run: runFor({ ...s, items, capacity }),
      raceRuns: raceRunsFor(ctx.view, items, capacity),
    };
  },

  newInput: (s, ctx) => {
    if (s.algorithm === "knapsack" || ctx.view === "race") {
      // A new bag: a handful of random items for the same capacity.
      const items = randomItems(Math.max(4, s.items.length), seededRandom(newSeed()));
      return { items, run: runFor({ ...s, items }), raceRuns: raceRunsFor(ctx.view, items, s.capacity) };
    }
    // "New" moves on to the next example pair, wrapping around.
    const at = wordPairs.findIndex((p) => p.a === s.a && p.b === s.b);
    const { a, b } = wordPairs[(at + 1) % wordPairs.length];
    return { a, b, run: runFor({ ...s, a, b }) };
  },

  engine: {
    // The race clock counts subproblems: it runs until the slowest method is done.
    lastIndex: (s, view) => (view === "race" ? Math.max(0, ...s.raceRuns.map((r) => r.length - 1)) : s.run.length - 1),
    stepWeight: (s, index) => STEP_WEIGHT[s.run.frames[index]?.event.type ?? "done"],
    pace: (view) => (view === "race" ? "dpRace" : "dp"),
    route: (s, ctx) => {
      if (ctx.view === "race") return { kind: "dpRace" };
      return ctx.isModuleStart ? { kind: "dp" } : { kind: "dpProblem", algorithm: s.algorithm };
    },
    // A knapsack (or its race) links its items; the word problems their words.
    search: (s, ctx) =>
      s.algorithm === "knapsack" || ctx.view === "race"
        ? toDpSearch({ items: encodeItems(s.items), capacity: s.capacity, speed: ctx.speedPreset })
        : toDpSearch({ a: s.a, b: s.b, speed: ctx.speedPreset }),
    game: (s) => questionsOf(s.run, dpQuestions),
  },
});
