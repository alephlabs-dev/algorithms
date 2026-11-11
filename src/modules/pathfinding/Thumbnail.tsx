import { mix } from "@/components/thumbnail";
import { cn } from "@/utils/cn";
import { seededRandom } from "@/utils/random";
import { applyPreset, emptyGrid } from "./grid";
import { pathSearches } from "./searches";
import { PathTimeline } from "./timeline";
import { FRONTIER, ON_PATH, VISITED, WALL } from "./types";

// A finished breadth-first search on random walls (the first seed that has a path).
const ROWS = 7;
const COLS = 21;
const search = (() => {
  for (let seed = 4; ; seed++) {
    const grid = applyPreset(emptyGrid(ROWS, COLS), "walls", seededRandom(seed));
    const frame = new PathTimeline(pathSearches.bfs, grid).frameAt(Infinity);
    if (frame.found) return { grid, frame };
  }
})();

const cellColor = (cell: number) => {
  if (cell === search.grid.start || search.frame.states[cell] === ON_PATH) return "var(--color-primary)";
  if (search.grid.cells[cell] === WALL) return mix("bar", 55);
  if (search.frame.states[cell] === VISITED) return mix("secondary", 34);
  if (search.frame.states[cell] === FRONTIER) return "var(--color-secondary)";
  return mix("edge", 55);
};

export const PathThumb = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={cn("grid gap-[2px]", className)}
    style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
  >
    {Array.from({ length: ROWS * COLS }, (_, cell) => (
      <span
        key={cell}
        className={cn(
          "aspect-square rounded-[2px]",
          cell === search.grid.end && "rounded-full ring-2 ring-inset ring-foreground",
        )}
        style={{ background: cell === search.grid.end ? "var(--color-background)" : cellColor(cell) }}
      />
    ))}
  </div>
);
