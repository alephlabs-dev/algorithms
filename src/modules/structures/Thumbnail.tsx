import { mix } from "@/components/thumbnail";
import { seededRandom } from "@/utils/random";
import { presetOperations } from "./presets";
import { TreeRecorder } from "./tree";

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
