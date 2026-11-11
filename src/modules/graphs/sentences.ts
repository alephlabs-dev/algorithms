// Step sentences of representative runs, for e2e/step-sentences-fit.spec.ts (see `sentences` in ../slice.ts).
import { graphPresets, graphSizes, makeGraph } from "./graph";
import { narrateGraph } from "./narrate";
import { graphTimelineFor } from "./run";
import { GRAPH_ALGORITHMS } from "./types";
import type { StepSentence } from "@/modules/slice";
import { seededRandom } from "@/utils/random";
import { LAYOUTS, SEEDS } from "@/utils/sentenceRuns";

export const sentences = function* (): Generator<StepSentence> {
  for (const algorithm of GRAPH_ALGORITHMS)
    for (const size of graphSizes)
      for (const preset of graphPresets)
        for (const seed of SEEDS)
          for (const layout of LAYOUTS) {
            const timeline = graphTimelineFor(algorithm, makeGraph(preset, size, layout.narrow, seededRandom(seed)));
            const run = `graphs ${algorithm} ${size} ${preset} ${layout.name} seed ${seed}`;
            for (let i = 0; i < timeline.length; i++) yield { run, sentence: narrateGraph(timeline, i, algorithm) };
          }
};
