import { graphTimelineFor, makeGraph } from "@/graphs";
import { applyPreset, emptyGrid, FRONTIER, ON_PATH, pathSearches, PathTimeline, VISITED, WALL } from "@/pathfinding";
import { cn } from "@/utils/cn";
import { seededRandom } from "@/utils/random";

/*
 * Small, still pictures of each module, drawn with plain elements so they
 * render in the prerendered HTML too. Both come from real runs.
 */

// Bubble Sort a few passes in: the largest values have settled on the right.
const BAR_COUNT = 20;
const PASSES = 6;
const COMPARING = 4;
const bars = (() => {
  const random = seededRandom(8);
  const values = Array.from({ length: BAR_COUNT }, () => 10 + Math.round(random() * 90));
  for (let p = 0; p < PASSES; p++) {
    for (let j = 0; j < BAR_COUNT - 1 - p; j++) {
      if (values[j] > values[j + 1]) [values[j], values[j + 1]] = [values[j + 1], values[j]];
    }
  }
  return values;
})();

export const SortingThumb = ({ className }: { className?: string }) => (
  <div aria-hidden className={cn("flex items-end gap-[3px]", className)}>
    {bars.map((height, i) => (
      <span
        key={i}
        style={{ height: `${height}%` }}
        className={cn(
          "flex-1 rounded-t-[3px] rounded-b-[1px]",
          i >= BAR_COUNT - PASSES ? "bg-primary" : i === COMPARING || i === COMPARING + 1 ? "bg-secondary" : "bg-bar",
        )}
      />
    ))}
  </div>
);

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

// The grid's own palette, mixed from the theme's colors so it follows light and dark.
const mix = (color: string, amount: number) =>
  `color-mix(in srgb, var(--color-${color}) ${amount}%, var(--color-background))`;

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

// A finished breadth-first search on a small network: its tree in the accent color.
const network = (() => {
  const graph = makeGraph("random", "medium", false, seededRandom(6));
  return { graph, frame: graphTimelineFor("bfs", graph).frameAt(Infinity) };
})();

export const GraphThumb = ({ className }: { className?: string }) => {
  const { graph, frame } = network;
  const W = 180;
  const H = W / graph.aspect;
  const at = (k: number) => [graph.nodes[k].x * W, graph.nodes[k].y * H];
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} className={className}>
      {graph.edges.map((e, k) => {
        const [ax, ay] = at(e.a);
        const [bx, by] = at(e.b);
        const tree = frame.parent[e.a] === k || frame.parent[e.b] === k;
        return (
          <line
            key={k}
            x1={ax}
            y1={ay}
            x2={bx}
            y2={by}
            strokeLinecap="round"
            strokeWidth={tree ? 2.5 : 1.5}
            stroke={tree ? "var(--color-primary)" : mix("muted", 55)}
          />
        );
      })}
      {graph.nodes.map((_, k) => {
        const [x, y] = at(k);
        return (
          <circle
            key={k}
            cx={x}
            cy={y}
            r={5}
            fill={mix("secondary", 42)}
            stroke={k === graph.start ? "var(--color-primary)" : "none"}
            strokeWidth={2}
          />
        );
      })}
    </svg>
  );
};
