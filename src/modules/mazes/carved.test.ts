import { describe, expect, it } from "vitest";
import { carvedCells } from "@/utils/mazeGenerators";
import { gridDimensions, gridSizes } from "@/utils/gridSize";
import { seededRandom } from "@/utils/random";
import { MazeRun } from "./run";
import { MAZE_ALGORITHMS, WALL } from "./types";

describe("a finished maze's open cells, outside a run", () => {
  it.each(MAZE_ALGORITHMS)("%s: the cells the run on the same seed leaves open, every size and layout", (algorithm) => {
    for (const size of gridSizes)
      for (const narrow of [false, true])
        for (let seed = 1; seed <= 5; seed++) {
          const grid = gridDimensions(size, narrow);
          const run = new MazeRun(algorithm, grid, seed);
          const { states } = run.frameAt(run.length - 1);
          const open = [...states.keys()].filter((cell) => states[cell] !== WALL);
          expect([...carvedCells(algorithm, grid, seededRandom(seed))].sort((a, b) => a - b)).toEqual(open);
        }
  });
});
