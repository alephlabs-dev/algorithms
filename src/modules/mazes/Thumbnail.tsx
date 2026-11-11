import { mix } from "@/components/thumbnail";
import { cn } from "@/utils/cn";
import { MazeRun } from "./run";
import { STACK, WALL } from "./types";

// Randomized depth-first search partway through a maze: its stack still out, the rest carved.
// Square, like the other thumbnails beside it.
const MAZE_ROWS = 13;
const MAZE_COLS = 13;
const maze = (() => {
  const run = new MazeRun("dfs", { rows: MAZE_ROWS, cols: MAZE_COLS }, 11);
  // DFS carves one cell per carve step, after the start: the first frame with half of them carved.
  const half = Math.ceil((((MAZE_ROWS - 1) / 2) * ((MAZE_COLS - 1) / 2)) / 2);
  let index = 0;
  for (let carved = 0; carved < half; index++) if (run.stepAt(index + 1)?.type !== "backtrack") carved++;
  return { run, frame: run.frameAt(index) };
})();

const mazeColor = (cell: number) => {
  const state = maze.frame.states[cell];
  if (cell === maze.run.start) return "var(--color-primary)";
  if (state === WALL) return mix("bar", 55);
  if (state === STACK) return "var(--color-secondary)";
  return mix("edge", 55);
};

export const MazeThumb = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={cn("mx-auto grid aspect-square gap-px", className)}
    style={{ gridTemplateColumns: `repeat(${MAZE_COLS}, minmax(0, 1fr))` }}
  >
    {Array.from({ length: MAZE_ROWS * MAZE_COLS }, (_, cell) => (
      <span
        key={cell}
        className={cn("aspect-square rounded-[2px]", cell === maze.run.start && "rounded-full")}
        style={{ background: mazeColor(cell) }}
      />
    ))}
  </div>
);
