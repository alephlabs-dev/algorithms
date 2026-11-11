// Step sentences of representative runs, for e2e/step-sentences-fit.spec.ts (see `sentences` in ../slice.ts).
import { pseudocode, SORT_ALGORITHMS, sortAlgorithms } from "./generators";
import { generateItems } from "./generateItems";
import { narrate } from "./narrate";
import { Timeline } from "./timeline";
import type { InputOrder } from "./types";
import type { StepSentence } from "@/modules/slice";
import { seededRandom } from "@/utils/random";
import { SEEDS } from "@/utils/sentenceRuns";

export const sentences = function* (): Generator<StepSentence> {
  const orders: InputOrder[] = ['random', 'nearlySorted', 'reversed', 'sorted', 'fewUnique'];
  for (const algorithm of SORT_ALGORITHMS)
    for (const order of orders)
      // Every size offered (400 from iPad up); the big ones once, they're long.
      for (const [size, seeds] of [[10, SEEDS], [20, SEEDS], [40, [1]], [100, [1]], [200, [1]], [400, [1]]] as const)
        for (const seed of seeds) {
          const timeline = new Timeline(sortAlgorithms[algorithm], generateItems(size, order, seededRandom(seed)));
          const run = `sorting ${algorithm} ${order} ${size} seed ${seed}`;
          for (let i = 0; i < timeline.length; i++) yield { run, sentence: narrate(timeline, i, pseudocode[algorithm]) };
        }
};
