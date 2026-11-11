import { mix } from "@/components/thumbnail";
import { DpRun } from "./run";

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
