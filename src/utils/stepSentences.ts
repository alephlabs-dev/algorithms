// Every step sentence of representative runs of each module, in the language of this page load.
// Not used by the app: e2e/step-sentences-fit.spec.ts loads it once per language and measures each
// sentence in the real caption (#113). Each module's slice lists its runs (`sentences`).
import { slices } from "@/modules/engine";
import { MODULES } from "@/routes";
import type { StepSentence } from "@/modules/slice";

export type { StepSentence };

/** Each distinct sentence once, with the first run that says it. */
export const stepSentences = (): StepSentence[] => {
  const seen = new Map<string, string>();
  for (const module of MODULES)
    for (const { run, sentence } of slices[module].sentences()) if (!seen.has(sentence)) seen.set(sentence, run);
  return [...seen].map(([sentence, run]) => ({ sentence, run }));
};
