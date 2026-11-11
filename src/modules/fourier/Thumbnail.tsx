import { mix } from "@/components/thumbnail";
import { FourierRun } from "./run";

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
  // Rounded: the build (Node) and the browser disagree in the last digits of the
  // trig behind these, and the landing page hydrates this exact markup (#140).
  const round = (n: number) => Math.round(n * 100) / 100;
  const px = (p: { x: number; y: number }) => [round(ox + p.x * unit), round(oy + p.y * unit)];
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
          <circle key={k} cx={cx} cy={cy} r={round(term.amp * unit)} fill="none" stroke={mix("muted", 55)} strokeWidth={0.7} />
        );
      })}
      <polyline points={chain.map(point).join(" ")} fill="none" stroke={mix("foreground", 65)} strokeWidth={0.9} />
      <circle cx={tip[0]} cy={tip[1]} r={2.6} fill="var(--color-primary)" />
    </svg>
  );
};
