import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { queensBoard, sudokuBoard } from "./board";
import { BoardRenderer, type BoardInput } from "./boardRenderer";
import { useElementSize } from "@/hooks/useElementSize";
import { localized } from "@/i18n";
import { selectGameQuestion, useStore } from "@/store";
import { cn } from "@/utils/cn";

const text = localized({
  en: {
    board: (n: number, placed: number) => `${n}×${n} board with ${placed} of ${n} queens placed.`,
    grid: (filled: number, empty: number) => `Sudoku grid with ${filled} of ${empty} empty cells filled.`,
    choices: "Choices",
    row: (row: number) => `Row ${row}`,
    rowIn: (row: number, col: number) => `Row ${row}: column ${col}`,
    rowEmpty: (row: number) => `Row ${row}: no queen yet`,
    cell: (row: number, col: number) => `R${row} C${col}`,
    cellIn: (row: number, col: number, digit: number) => `Row ${row}, column ${col}: ${digit}`,
    more: (n: number) => `+${n} more`,
    none: "None yet",
    deadEndAt: (row: number, col: number) => `Row ${row}, column ${col}: no digit left`,
    takenBack: (row: number, col: number, digit: number) => `Row ${row}, column ${col}: ${digit} taken back`,
  },
  es: {
    board: (n, placed) => `Tablero de ${n}×${n} con ${placed} de ${n} reinas colocadas.`,
    grid: (filled, empty) => `Sudoku con ${filled} de ${empty} casillas vacías llenas.`,
    choices: "Elecciones",
    row: (row) => `Fila ${row}`,
    rowIn: (row, col) => `Fila ${row}: columna ${col}`,
    rowEmpty: (row) => `Fila ${row}: aún sin reina`,
    cell: (row, col) => `F${row} C${col}`,
    cellIn: (row, col, digit) => `Fila ${row}, columna ${col}: ${digit}`,
    more: (n) => `+${n} más`,
    none: "Ninguna aún",
    deadEndAt: (row, col) => `Fila ${row}, columna ${col}: sin dígitos`,
    takenBack: (row, col, digit) => `Fila ${row}, columna ${col}: se quita el ${digit}`,
  },
});

/** The board on stage, for whichever problem: a chessboard of queens or a Sudoku grid. */
export const BacktrackingStage = () => {
  const problem = useStore((s) => s.backtracking.problem);
  return problem === "sudoku" ? <SudokuStage /> : <QueensStage />;
};

/** The canvas, drawing `board` at the size it's given. */
const Board = ({ board, label }: { board: BoardInput; label: string }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BoardRenderer | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const theme = useStore((s) => s.theme);

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

  return (
    <div data-tour="bars" ref={wrapperRef} className="relative min-h-0 min-w-0 flex-1">
      <canvas ref={canvasRef} role="img" aria-label={label} className="absolute inset-0 h-full w-full select-none" />
    </div>
  );
};

const Strip = ({ children }: { children: ReactNode }) => (
  <section
    data-tour="choices"
    aria-label={text.choices}
    className="flex shrink-0 flex-col gap-1.5 landscape:w-36 landscape:justify-center"
  >
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">{text.choices}</h2>
    {children}
  </section>
);

const slotClass = "flex min-w-0 items-center justify-between gap-1 rounded-lg border px-2 py-1 font-mono text-xs";
const standing = "border-primary/60 bg-primary/15 text-foreground";
const deadEndSlot = "border-conflict bg-conflict/15 ring-2 ring-conflict";

/**
 * N-Queens: the board, and one slot per row with the column its queen is in.
 * The strip grows with every choice and shrinks with every backtrack.
 */
const QueensStage = () => {
  const { run, frameIndex, ask } = useStore(
    useShallow((s) => {
      const question = selectGameQuestion(s);
      return {
        run: s.backtracking.queensRun,
        frameIndex: s.frameIndex,
        ask: question?.kind === "choice" ? question.queenRow : undefined,
      };
    }),
  );
  const frame = run.frameAt(frameIndex);
  const board = useMemo(() => queensBoard(frame, run.n, ask), [frame, run.n, ask]);
  const { event } = frame;
  // The row the step is about, or the one guess mode asks about: the strip lights its slot up.
  const activeRow = ask ? ask.row : event.type === "start" || event.type === "done" ? null : event.row;
  const deadEnd = event.type === "deadEnd";

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 landscape:flex-row">
      <Board board={board} label={text.board(run.n, frame.queens.length)} />
      <Strip>
        <ol className="flex gap-1.5 landscape:flex-col">
          {Array.from({ length: run.n }, (_, row) => {
            const col = frame.queens[row];
            const placed = col !== undefined;
            const active = row === activeRow;
            return (
              <li
                key={row}
                aria-label={placed ? text.rowIn(row + 1, col + 1) : text.rowEmpty(row + 1)}
                className={cn(
                  slotClass,
                  "flex-1 landscape:flex-none",
                  placed ? standing : "border-dashed border-line/60 text-foreground/40",
                  active && !deadEnd && "ring-2 ring-foreground/70",
                  active && deadEnd && deadEndSlot,
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
      </Strip>
    </div>
  );
};

// How many of the latest choices the stack shows: a row of them upright, a column side by side.
const SHOWN_UPRIGHT = 3;
const SHOWN_SIDEWAYS = 8;

/**
 * Sudoku: the grid, and the latest choices that stand as a stack, newest last.
 * Too many cells to give each a slot, so older choices fold into "+23".
 * A dead end and a backtrack show at the end, as the step that's about to pop the stack.
 */
const SudokuStage = () => {
  const { run, frameIndex } = useStore(useShallow((s) => ({ run: s.backtracking.sudokuRun, frameIndex: s.frameIndex })));
  const frame = run.frameAt(frameIndex);
  const board = useMemo(() => sudokuBoard(frame, run), [frame, run]);
  const { event, stack, grid } = frame;
  const latest = stack.slice(-SHOWN_SIDEWAYS);
  const hidden = (shown: number) => Math.max(0, stack.length - shown);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 landscape:flex-row">
      <Board board={board} label={text.grid(stack.length, run.emptyCount)} />
      <Strip>
        <ol className="flex items-center gap-1.5 landscape:flex-col landscape:items-stretch">
          {stack.length === 0 && event.type !== "deadEnd" && event.type !== "backtrack" && (
            <li className="py-1 font-mono text-xs text-foreground/40">{text.none}</li>
          )}
          {hidden(SHOWN_UPRIGHT) > 0 && (
            <li className="shrink-0 font-mono text-xs text-foreground/60 landscape:hidden">
              {text.more(hidden(SHOWN_UPRIGHT))}
            </li>
          )}
          {hidden(SHOWN_SIDEWAYS) > 0 && (
            <li className="hidden font-mono text-xs text-foreground/60 landscape:block">
              {text.more(hidden(SHOWN_SIDEWAYS))}
            </li>
          )}
          {latest.map((cell, k) => {
            const row = Math.floor(cell / 9) + 1;
            const col = (cell % 9) + 1;
            const newest = k === latest.length - 1 && event.type === "choice";
            // Upright, only the last few fit in a row.
            const sidewaysOnly = k < latest.length - SHOWN_UPRIGHT;
            return (
              <li
                key={cell}
                aria-label={text.cellIn(row, col, grid[cell])}
                className={cn(slotClass, standing, newest && "ring-2 ring-foreground/70", sidewaysOnly && "hidden landscape:flex")}
              >
                <span aria-hidden className="text-foreground/60">
                  {text.cell(row, col)} →
                </span>
                <span aria-hidden className="font-semibold">
                  {grid[cell]}
                </span>
              </li>
            );
          })}
          {event.type === "deadEnd" && (
            <li aria-label={text.deadEndAt(event.row + 1, event.col + 1)} className={cn(slotClass, deadEndSlot)}>
              <span aria-hidden className="text-foreground/60">
                {text.cell(event.row + 1, event.col + 1)}
              </span>
              <span aria-hidden className="font-semibold text-conflict">
                ✕
              </span>
            </li>
          )}
          {event.type === "backtrack" && (
            <li
              aria-label={text.takenBack(event.row + 1, event.col + 1, event.digit)}
              className={cn(slotClass, "border-dashed border-line/60 text-foreground/50")}
            >
              <span aria-hidden>{text.cell(event.row + 1, event.col + 1)}</span>
              <span aria-hidden className="font-semibold line-through">
                {event.digit}
              </span>
            </li>
          )}
        </ol>
      </Strip>
    </div>
  );
};
