import { FourierRun } from "@/fourier";
import { presetOperations, TreeRecorder } from "@/structures";
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

// Ten circles a third of the way round, retracing a heart.
const epicycles = (() => {
  const run = new FourierRun("epicycles", 10, "heart", null);
  const at = Math.round(run.length * 0.62);
  return { run, chain: run.frameAt(at).chain, at };
})();

export const FourierThumb = ({ className }: { className?: string }) => {
  const { run, chain, at } = epicycles;
  const size = 100;
  const unit = 42;
  const point = (p: { x: number; y: number }) => `${size / 2 + p.x * unit},${size / 2 + p.y * unit}`;
  return (
    <svg aria-hidden viewBox={`0 0 ${size} ${size}`} className={className}>
      <polyline
        points={run.target.map(point).join(" ")}
        fill="none"
        stroke={mix("muted", 50)}
        strokeWidth={1}
        strokeDasharray="2 3"
      />
      <polyline
        points={run.tips
          .slice(0, at + 1)
          .map(point)
          .join(" ")}
        fill="none"
        stroke="var(--color-secondary)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {run.terms.slice(0, 6).map((term, k) => (
        <circle
          key={k}
          cx={size / 2 + chain[k].x * unit}
          cy={size / 2 + chain[k].y * unit}
          r={term.amp * unit}
          fill="none"
          stroke={mix("muted", 45)}
          strokeWidth={0.6}
        />
      ))}
      <polyline points={chain.map(point).join(" ")} fill="none" stroke={mix("foreground", 60)} strokeWidth={0.8} />
      <circle
        cx={size / 2 + chain[chain.length - 1].x * unit}
        cy={size / 2 + chain[chain.length - 1].y * unit}
        r={2.2}
        fill="var(--color-primary)"
      />
    </svg>
  );
};

// An AVL tree built from the example's first values: balanced, so it fans out evenly.
const avlTree = (() => {
  const run = new TreeRecorder("avl", presetOperations("example", "small", seededRandom(1)));
  const frame = run.frames[run.frames.length - 1];
  const byId = new Map(frame.nodes.map((n) => [n.id, n]));
  const order: number[] = [];
  const depth = new Map<number, number>();
  const walk = (id: number | null, d: number) => {
    if (id === null) return;
    walk(byId.get(id)!.left, d + 1);
    order.push(id);
    depth.set(id, d);
    walk(byId.get(id)!.right, d + 1);
  };
  walk(frame.root, 0);
  const at = new Map(
    order.map((id, k) => [id, { x: 10 + (k + 0.5) * (180 / order.length), y: 12 + depth.get(id)! * 26 }]),
  );
  return { frame, at };
})();

export const StructureThumb = ({ className }: { className?: string }) => {
  const { frame, at } = avlTree;
  return (
    <svg aria-hidden viewBox="0 0 200 90" className={className}>
      {frame.nodes.flatMap((n) =>
        [n.left, n.right]
          .filter((c): c is number => c !== null)
          .map((c) => (
            <line
              key={`${n.id}-${c}`}
              x1={at.get(n.id)!.x}
              y1={at.get(n.id)!.y}
              x2={at.get(c)!.x}
              y2={at.get(c)!.y}
              stroke={mix("muted", 55)}
              strokeWidth={1.5}
            />
          )),
      )}
      {frame.nodes.map((n) => (
        <circle
          key={n.id}
          cx={at.get(n.id)!.x}
          cy={at.get(n.id)!.y}
          r={7}
          fill={n.id === frame.root ? "var(--color-primary)" : mix("secondary", 42)}
        />
      ))}
    </svg>
  );
};
