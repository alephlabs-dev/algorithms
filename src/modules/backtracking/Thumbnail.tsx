import { mix } from "@/components/thumbnail";
import { QueensRun } from "./queens";

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
