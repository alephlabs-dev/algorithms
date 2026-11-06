import type { BoardCell, BoardInput } from "@/canvas/boardRenderer";
import { attacks } from "./queens";
import type { QueensFrame } from "./types";

const QUEEN = { kind: "queen" } as const;

/** An N-Queens frame as the board draws it: the queens, the squares they attack, and what the step did. */
export const queensBoard = (frame: QueensFrame, n: number): BoardInput => {
  const { event, queens } = frame;
  const placed = queens.map((col, row) => ({ row, col }));
  const cells: BoardCell[] = Array.from({ length: n * n }, (_, k) => {
    const square = { row: Math.floor(k / n), col: k % n };
    return { shade: placed.some((queen) => attacks(queen, square)) };
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
  return { rows: n, cols: n, cells, lines, deadEnd, rowLabels: labels, colLabels: labels };
};
