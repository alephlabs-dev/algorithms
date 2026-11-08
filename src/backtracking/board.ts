import type { BoardCell, BoardInput } from "@/canvas/boardRenderer";
import { attacks } from "./queens";
import type { SudokuRun } from "./sudoku";
import type { QueensFrame, SudokuFrame } from "./types";

const QUEEN = { kind: "queen" } as const;

/**
 * An N-Queens frame as the board draws it: the queens, the squares they attack, and what the step did.
 * While guess mode asks where a row's queen lands (`ask`), the attacked squares aren't shaded, since
 * they'd give the answer away; the columns left to try are outlined instead.
 */
export const queensBoard = (frame: QueensFrame, n: number, ask?: { row: number; from: number } | null): BoardInput => {
  const { event, queens } = frame;
  const placed = queens.map((col, row) => ({ row, col }));
  const cells: BoardCell[] = Array.from({ length: n * n }, (_, k) => {
    const square = { row: Math.floor(k / n), col: k % n };
    return { shade: !ask && placed.some((queen) => attacks(queen, square)) };
  });
  const cell = (row: number, col: number) => cells[row * n + col];
  placed.forEach(({ row, col }) => Object.assign(cell(row, col), { piece: QUEEN, tone: "placed" }));

  const lines: BoardInput["lines"] = [];
  let deadEnd: BoardInput["deadEnd"] = null;
  if (event.type === "choice") cell(event.row, event.col).tone = "focus";
  else if (event.type === "conflict") {
    Object.assign(cell(event.row, event.col), { piece: QUEEN, tone: "conflict" });
    cell(event.by.row, event.by.col).tone = "attacker";
    lines.push({ from: { row: event.row, col: event.col }, to: event.by });
  } else if (event.type === "deadEnd") deadEnd = { from: { row: event.row, col: 0 }, to: { row: event.row, col: n - 1 } };
  else if (event.type === "backtrack") Object.assign(cell(event.row, event.col), { piece: QUEEN, tone: "ghost" });

  const labels = Array.from({ length: n }, (_, k) => String(k + 1));
  const asked = ask ? { from: { row: ask.row, col: ask.from }, to: { row: ask.row, col: n - 1 } } : null;
  return { rows: n, cols: n, cells, lines, deadEnd, ask: asked, rowLabels: labels, colLabels: labels };
};

/** A Sudoku frame as the board draws it: givens in ink, digits placed in green, and what the step did. */
export const sudokuBoard = (frame: SudokuFrame, run: SudokuRun): BoardInput => {
  const { event, grid } = frame;
  const cells: BoardCell[] = grid.map((digit, k) =>
    digit === 0
      ? {}
      : { piece: { kind: "text", value: String(digit) }, tone: "placed", given: run.givens[k] },
  );
  const cell = (row: number, col: number) => cells[row * 9 + col];
  // Fewest options first: each empty cell shows how many digits fit; the fewest are lit.
  if (frame.options) {
    const counts = frame.options.filter((n): n is number => n !== null);
    const fewest = Math.min(...counts);
    frame.options.forEach((n, k) => {
      if (n !== null) cells[k].note = { text: String(n), lit: n === fewest };
    });
  }

  const lines: BoardInput["lines"] = [];
  let deadEnd: BoardInput["deadEnd"] = null;
  if (event.type === "choice") cell(event.row, event.col).tone = "focus";
  else if (event.type === "conflict") {
    Object.assign(cell(event.row, event.col), { piece: { kind: "text", value: String(event.digit) }, tone: "conflict" });
    cell(event.by.row, event.by.col).tone = "attacker";
    lines.push({ from: { row: event.row, col: event.col }, to: event.by });
  } else if (event.type === "deadEnd") deadEnd = { from: { row: event.row, col: event.col }, to: { row: event.row, col: event.col } };
  else if (event.type === "backtrack")
    Object.assign(cell(event.row, event.col), { piece: { kind: "text", value: String(event.digit) }, tone: "ghost" });

  const labels = Array.from({ length: 9 }, (_, k) => String(k + 1));
  return { rows: 9, cols: 9, cells, lines, deadEnd, rowLabels: labels, colLabels: labels, plain: true, box: 3 };
};
