// Step sentences of representative runs, for e2e/step-sentences-fit.spec.ts (see `sentences` in ../slice.ts).
import { narrateMaze } from "./narrate";
import { MazeRun } from "./run";
import { MAZE_ALGORITHMS } from "./types";
import type { StepSentence } from "@/modules/slice";
import { gridDimensions, type GridSize } from "@/utils/gridSize";
import { LAYOUTS, SEEDS } from "@/utils/sentenceRuns";

export const sentences = function* (): Generator<StepSentence> {
  const sizes: GridSize[] = ['small', 'medium', 'large'];
  for (const algorithm of MAZE_ALGORITHMS)
    for (const size of sizes)
      for (const seed of SEEDS)
        for (const layout of LAYOUTS) {
          const maze = new MazeRun(algorithm, gridDimensions(size, layout.narrow), seed);
          const run = `mazes ${algorithm} ${size} ${layout.name} seed ${seed}`;
          for (let i = 0; i < maze.length; i++) yield { run, sentence: narrateMaze(maze, i) };
        }
};
