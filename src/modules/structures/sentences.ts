// Step sentences of representative runs, for e2e/step-sentences-fit.spec.ts (see `sentences` in ../slice.ts).
import { narrateTree } from "./narrate";
import { presetOperations, type StructurePreset, type StructureSize } from "./presets";
import { recordStructure } from "./record";
import { STRUCTURE_ALGORITHMS, type Operation } from "./types";
import type { StepSentence } from "@/modules/slice";
import { seededRandom } from "@/utils/random";
import { SEEDS } from "@/utils/sentenceRuns";

/**
 * After the preset's inserts, what a learner can type below the stage: finding a value that's
 * there and one that isn't, deleting (the root or minimum, a middle value, a missing one), a
 * duplicate insert, and enough inserts to fill a probing table.
 */
const typedOperations = (ops: Operation[]): Operation[] => {
  const values = ops.map((op) => op.value);
  const sorted = [...values].sort((a, b) => a - b);
  const missing = [2, 49, 97].filter((v) => !values.includes(v));
  const fill = Array.from({ length: 30 }, (_, k) => 3 + k * 3).filter((v) => !values.includes(v) && !missing.includes(v));
  return [
    ...ops,
    { kind: 'search', value: sorted[Math.floor(sorted.length / 2)] },
    { kind: 'search', value: sorted[sorted.length - 1] },
    ...missing.map((value): Operation => ({ kind: 'search', value })),
    { kind: 'insert', value: values[0] },
    { kind: 'delete', value: values[0] },
    { kind: 'delete', value: sorted[0] },
    { kind: 'delete', value: sorted[Math.floor(sorted.length / 2)] },
    { kind: 'delete', value: missing[0] },
    ...fill.map((value): Operation => ({ kind: 'insert', value })),
  ];
};

export const sentences = function* (): Generator<StepSentence> {
  const algorithms = STRUCTURE_ALGORITHMS;
  const presets: StructurePreset[] = ['example', 'random', 'ascending'];
  const sizes: StructureSize[] = ['small', 'medium', 'large'];
  for (const algorithm of algorithms)
    for (const preset of presets)
      for (const size of sizes)
        for (const seed of SEEDS) {
          const structure = recordStructure(algorithm, typedOperations(presetOperations(preset, size, seededRandom(seed))));
          const run = `structures ${algorithm} ${preset} ${size} seed ${seed}`;
          for (let i = 0; i < structure.frames.length; i++) yield { run, sentence: narrateTree(structure, i) };
        }
};
