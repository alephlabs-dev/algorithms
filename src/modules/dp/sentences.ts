// Step sentences of representative runs, for e2e/step-sentences-fit.spec.ts (see `sentences` in ../slice.ts).
import { KnapsackRun } from "./knapsack";
import { narrateDp } from "./narrate";
import { EXAMPLE_CAPACITY, EXAMPLE_ITEMS, RACE_CAPACITY, RACE_ITEMS, randomItems, wordPairs } from "./presets";
import { DpRun } from "./run";
import { MAX_CAPACITY, MAX_ITEMS, MAX_WORD } from "./types";
import type { StepSentence } from "@/modules/slice";
import { seededRandom } from "@/utils/random";
import { SEEDS } from "@/utils/sentenceRuns";

// The worst words a learner can type: as long as allowed, in the widest letters. Different,
// the same, sharing no letter, and nearly the same, so every kind of sentence comes up.
const W = 'W'.repeat(MAX_WORD);
const M = 'M'.repeat(MAX_WORD);
const NEARLY_W = `${'W'.repeat(MAX_WORD - 1)}M`;
const WIDE_WORDS = [
  { a: W, b: M },
  { a: W, b: W },
  { a: NEARLY_W, b: W },
  { a: `M${'W'.repeat(MAX_WORD - 1)}`, b: NEARLY_W },
];

export const sentences = function* (): Generator<StepSentence> {
  const tables = [
    ...[...wordPairs, ...WIDE_WORDS].flatMap(({ a, b }) => [
      { run: `dp edit ${a} ${b}`, table: new DpRun('edit', a, b) },
      { run: `dp lcs ${a} ${b}`, table: new DpRun('lcs', a, b) },
    ]),
    { run: 'dp knapsack example', table: new KnapsackRun(EXAMPLE_ITEMS, EXAMPLE_CAPACITY) },
    { run: 'dp knapsack race', table: new KnapsackRun(RACE_ITEMS, RACE_CAPACITY) },
    ...SEEDS.flatMap((seed) =>
      [MAX_ITEMS - 1, MAX_ITEMS].map((count) => ({
        run: `dp knapsack ${count} items seed ${seed}`,
        table: new KnapsackRun(randomItems(count, seededRandom(seed)), MAX_CAPACITY),
      }))
    ),
  ];
  for (const { run, table } of tables)
    for (let i = 0; i < table.length; i++) yield { run, sentence: narrateDp(table, i) };
};
