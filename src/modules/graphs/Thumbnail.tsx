import { mix } from "@/components/thumbnail";
import { seededRandom } from "@/utils/random";
import { makeGraph } from "./graph";
import { graphTimelineFor } from "./run";

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
