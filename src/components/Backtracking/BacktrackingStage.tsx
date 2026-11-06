import { useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { queensBoard } from "@/backtracking";
import { BoardRenderer } from "@/canvas/boardRenderer";
import { useElementSize } from "@/hooks/useElementSize";
import { localized } from "@/i18n";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";

const text = localized({
  en: {
    board: (n: number, placed: number) => `${n}×${n} board with ${placed} of ${n} queens placed.`,
    choices: "Choices",
    row: (row: number) => `Row ${row}`,
    rowIn: (row: number, col: number) => `Row ${row}: column ${col}`,
    rowEmpty: (row: number) => `Row ${row}: no queen yet`,
  },
  es: {
    board: (n, placed) => `Tablero de ${n}×${n} con ${placed} de ${n} reinas colocadas.`,
    choices: "Elecciones",
    row: (row) => `Fila ${row}`,
    rowIn: (row, col) => `Fila ${row}: columna ${col}`,
    rowEmpty: (row) => `Fila ${row}: aún sin reina`,
  },
});

/**
 * The board, and next to it the choices that stand: one slot per row with
 * the column its queen is in. The strip grows with every choice and shrinks
 * with every backtrack, so the search's depth is always in view.
 */
export const BacktrackingStage = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BoardRenderer | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const { run, frameIndex, theme } = useStore(
    useShallow((s) => ({ run: s.queensRun, frameIndex: s.frameIndex, theme: s.theme })),
  );
  const frame = run.frameAt(frameIndex);
  const board = useMemo(() => queensBoard(frame, run.n), [frame, run.n]);

  useEffect(() => {
    rendererRef.current = new BoardRenderer(canvasRef.current!);
  }, []);

  useEffect(() => {
    rendererRef.current?.resize(width, height, window.devicePixelRatio || 1);
  }, [width, height]);

  useEffect(() => {
    rendererRef.current?.refreshColors();
  }, [theme]);

  useEffect(() => {
    rendererRef.current?.update(board);
  }, [board]);

  const { event } = frame;
  // The row the step is about: the strip lights its slot up.
  const activeRow = event.type === "start" || event.type === "done" ? null : event.row;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 landscape:flex-row">
      <div data-tour="bars" ref={wrapperRef} className="relative min-h-0 min-w-0 flex-1">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={text.board(run.n, frame.queens.length)}
          className="absolute inset-0 h-full w-full select-none"
        />
      </div>
      <ChoiceStrip n={run.n} queens={frame.queens} activeRow={activeRow} deadEnd={event.type === "deadEnd"} />
    </div>
  );
};

const ChoiceStrip = ({
  n,
  queens,
  activeRow,
  deadEnd,
}: {
  n: number;
  queens: number[];
  activeRow: number | null;
  deadEnd: boolean;
}) => (
  <section
    data-tour="choices"
    aria-label={text.choices}
    className="flex shrink-0 flex-col gap-1.5 landscape:w-36 landscape:justify-center"
  >
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">{text.choices}</h2>
    <ol className="flex gap-1.5 landscape:flex-col">
      {Array.from({ length: n }, (_, row) => {
        const col = queens[row];
        const placed = col !== undefined;
        const active = row === activeRow;
        return (
          <li
            key={row}
            aria-label={placed ? text.rowIn(row + 1, col + 1) : text.rowEmpty(row + 1)}
            className={cn(
              "flex min-w-0 flex-1 items-center justify-between gap-1 rounded-lg border px-2 py-1 font-mono text-xs landscape:flex-none",
              placed ? "border-primary/60 bg-primary/15 text-foreground" : "border-dashed border-line/60 text-foreground/40",
              active && !deadEnd && "ring-2 ring-foreground/70",
              active && deadEnd && "border-conflict bg-conflict/15 ring-2 ring-conflict",
            )}
          >
            <span aria-hidden className="hidden text-foreground/60 landscape:inline">
              {text.row(row + 1)}
            </span>
            <span aria-hidden className="w-full text-center font-semibold landscape:w-auto">
              {placed ? col + 1 : "·"}
            </span>
          </li>
        );
      })}
    </ol>
  </section>
);
