// Step sentences of representative runs, for e2e/step-sentences-fit.spec.ts (see `sentences` in ../slice.ts).
import { applyPreset, emptyGrid, type Preset } from "./grid";
import { narratePath } from "./narrate";
import { PATH_ALGORITHMS, pathSearches } from "./searches";
import { PathTimeline } from "./timeline";
import type { StepSentence } from "@/modules/slice";
import { gridDimensions, type GridSize } from "@/utils/gridSize";
import { seededRandom } from "@/utils/random";
import { LAYOUTS, SEEDS } from "@/utils/sentenceRuns";

export const sentences = function* (): Generator<StepSentence> {
  const sizes: GridSize[] = ['small', 'medium', 'large'];
  const presets: Preset[] = ['clear', 'maze', 'walls', 'terrain'];
  for (const algorithm of PATH_ALGORITHMS)
    for (const size of sizes)
      for (const preset of presets)
        for (const seed of SEEDS)
          for (const layout of LAYOUTS) {
            const { rows, cols } = gridDimensions(size, layout.narrow);
            const grid = applyPreset(emptyGrid(rows, cols), preset, seededRandom(seed));
            const timeline = new PathTimeline(pathSearches[algorithm], grid);
            const run = `pathfinding ${algorithm} ${size} ${preset} ${layout.name} seed ${seed}`;
            for (let i = 0; i < timeline.length; i++) yield { run, sentence: narratePath(timeline, i, algorithm) };
          }
};
