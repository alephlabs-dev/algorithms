import { QueensRun } from "@/backtracking";
import { DpRun } from "@/dp";
import { FourierRun } from "@/fourier";
import { presetOperations, TreeRecorder } from "@/structures";
import { graphTimelineFor, makeGraph } from "@/graphs";
import { MazeRun, STACK, WALL as MAZE_WALL } from "@/mazes";
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
    <svg aria-hidden viewBox={`-9 -9 ${W + 18} ${H + 18}`} className={className}>
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

// Circles on circles, most of the way round a heart.
const epicycles = (() => {
  const run = new FourierRun("epicycles", 24, "heart", null);
  const at = Math.round(run.length * 0.86);
  const xs = run.target.map((p) => p.x);
  const ys = run.target.map((p) => p.y);
  const box = {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
  return { run, chain: run.frameAt(at).chain, at, box };
})();

export const FourierThumb = ({ className }: { className?: string }) => {
  const { run, chain, at, box } = epicycles;
  const size = 100;
  const unit = (size - 16) / Math.max(box.w, box.h);
  const ox = (size - box.w * unit) / 2 - box.x * unit;
  const oy = (size - box.h * unit) / 2 - box.y * unit;
  const px = (p: { x: number; y: number }) => [ox + p.x * unit, oy + p.y * unit];
  const point = (p: { x: number; y: number }) => px(p).join(",");
  const tip = px(chain[chain.length - 1]);
  return (
    <svg aria-hidden viewBox={`0 0 ${size} ${size}`} className={className} overflow="visible">
      <polygon points={run.target.map(point).join(" ")} fill={mix("secondary", 14)} stroke="none" />
      <polyline
        points={run.tips
          .slice(0, at + 1)
          .map(point)
          .join(" ")}
        fill="none"
        stroke="var(--color-secondary)"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {run.terms.slice(0, 8).map((term, k) => {
        const [cx, cy] = px(chain[k]);
        return (
          <circle key={k} cx={cx} cy={cy} r={term.amp * unit} fill="none" stroke={mix("muted", 55)} strokeWidth={0.7} />
        );
      })}
      <polyline points={chain.map(point).join(" ")} fill="none" stroke={mix("foreground", 65)} strokeWidth={0.9} />
      <circle cx={tip[0]} cy={tip[1]} r={2.6} fill="var(--color-primary)" />
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
  const height = 24 + Math.max(0, frame.height) * 26;
  return { frame, at, height };
})();

export const StructureThumb = ({ className }: { className?: string }) => {
  const { frame, at, height } = avlTree;
  return (
    <svg aria-hidden viewBox={`0 0 200 ${height}`} className={className}>
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

// Edit distance from KITTEN to SITTING, filled in, with the way back from the corner lit.
const dpTable = (() => {
  const run = new DpRun("edit", "KITTEN", "SITTING");
  const path = new Set(run.trace.map((s) => `${s.i},${s.j}`));
  path.add("0,0");
  return { run, path };
})();

export const DpThumb = ({ className }: { className?: string }) => {
  const { run, path } = dpTable;
  const rows = run.a.length + 1;
  const cols = run.b.length + 1;
  const cell = 12;
  return (
    <svg aria-hidden viewBox={`-2 -2 ${cols * cell + 4} ${rows * cell + 4}`} className={className}>
      {run.table.flatMap((row, i) =>
        row.map((value, j) => {
          const lit = path.has(`${i},${j}`);
          const corner = i === rows - 1 && j === cols - 1;
          return (
            <g key={`${i}-${j}`}>
              <rect
                x={j * cell + 1}
                y={i * cell + 1}
                width={cell - 2}
                height={cell - 2}
                rx={2}
                fill={corner ? "var(--color-secondary)" : lit ? "var(--color-primary)" : mix("muted", i === 0 || j === 0 ? 22 : 34)}
              />
              {(lit || corner) && (
                <text
                  x={j * cell + cell / 2}
                  y={i * cell + cell / 2 + 2.6}
                  textAnchor="middle"
                  fontSize={7}
                  fontWeight={600}
                  fontFamily="JetBrains Mono, monospace"
                  fill="var(--color-background)"
                >
                  {value}
                </text>
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
};

// Six queens, the search paused on a conflict: four placed, a fifth square ruled out by the queen it's lined up with.
const QUEENS = 6;
const queensFrame = new QueensRun(QUEENS).frames.find((f) => f.event.type === "conflict" && f.queens.length === 4)!;

export const QueensThumb = ({ className }: { className?: string }) => {
  const n = QUEENS;
  const cell = 12;
  const { queens, event } = queensFrame;
  const conflict = event.type === "conflict" ? event : null;
  const center = (k: number) => k * cell + cell / 2;
  return (
    <svg aria-hidden viewBox={`-1 -1 ${n * cell + 2} ${n * cell + 2}`} className={className}>
      {Array.from({ length: n * n }, (_, k) => {
        const row = Math.floor(k / n);
        const col = k % n;
        return (
          <rect
            key={k}
            x={col * cell}
            y={row * cell}
            width={cell}
            height={cell}
            fill={mix("muted", (row + col) % 2 === 0 ? 14 : 30)}
          />
        );
      })}
      {conflict && (
        <>
          <rect
            x={conflict.col * cell + 1}
            y={conflict.row * cell + 1}
            width={cell - 2}
            height={cell - 2}
            fill="none"
            stroke="var(--color-conflict)"
            strokeWidth={1.5}
          />
          <line
            x1={center(conflict.col)}
            y1={center(conflict.row)}
            x2={center(conflict.by.col)}
            y2={center(conflict.by.row)}
            stroke="var(--color-conflict)"
            strokeWidth={1.2}
            strokeDasharray="2 1.5"
          />
        </>
      )}
      {queens.map((col, row) => (
        <circle key={row} cx={center(col)} cy={center(row)} r={cell * 0.3} fill="var(--color-primary)" />
      ))}
    </svg>
  );
};

// Randomized depth-first search partway through a maze: its stack still out, the rest carved.
const MAZE_ROWS = 9;
const MAZE_COLS = 21;
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
  if (state === MAZE_WALL) return mix("bar", 55);
  if (state === STACK) return "var(--color-secondary)";
  return mix("edge", 55);
};

export const MazeThumb = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={cn("grid gap-[2px]", className)}
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
