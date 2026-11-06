import type { BoardCell, BoardInput } from "@/canvas/boardRenderer";
import type { QueensFrame } from "./types";

/** An N-Queens frame as the board draws it: the queens, the squares they attack, and what the step did. */
export const queensBoard = (frame: QueensFrame, n: number): BoardInput => {
  const { event, queens } = frame;
  const cells: BoardCell[] = Array.from({ length: n * n }, () => ({}));
  const cell = (row: number, col: number) => cells[row * n + col];

  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) cell(row, col).shade = attacked(queens, row, col);
  queens.forEach((col, row) => Object.assign(cell(row, col), { piece: "queen", tone: "placed", shade: false }));

  const lines: BoardInput["lines"] = [];
  let stuckRow: number | null = null;
  if (event.type === "choice") cell(event.row, event.col).tone = "focus";
  else if (event.type === "conflict") {
    Object.assign(cell(event.row, event.col), { piece: "queen", tone: "conflict" });
    cell(event.by.row, event.by.col).tone = "attacker";
    lines.push({ from: { row: event.row, col: event.col }, to: event.by });
  } else if (event.type === "deadEnd") stuckRow = event.row;
  else if (event.type === "backtrack") Object.assign(cell(event.row, event.col), { piece: "queen", tone: "ghost" });

  const labels = Array.from({ length: n }, (_, k) => String(k + 1));
  return { rows: n, cols: n, cells, lines, stuckRow, rowLabels: labels, colLabels: labels };
};

/** Whether a placed queen in another row attacks (row, col). */
const attacked = (queens: number[], row: number, col: number) =>
  queens.some((c, r) => r !== row && (c === col || Math.abs(c - col) === Math.abs(r - row)));
