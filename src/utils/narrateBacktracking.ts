import { rowOrderRun, type QueensRun, type SudokuRule, type SudokuRun } from "@/backtracking";
import { localized } from "@/i18n";
import { count } from "./count";

// Rows and columns are counted from 1 in words, as on the board's labels.
const text = localized({
  en: {
    start: (n: number) =>
      `${n} queens on a ${n}×${n} board, one per row. Press play: each row tries its columns from the left.`,
    choice: (row: number, col: number, last: boolean) =>
      `Row ${row}, column ${col} is safe, so a queen goes there.${last ? " That was the last row." : ` On to row ${row + 1}.`}`,
    conflict: (row: number, col: number, by: number, sameColumn: boolean) =>
      `Row ${row}, column ${col}: the queen in row ${by} attacks it ${sameColumn ? "down the column" : "along a diagonal"}. A conflict, so skip it.`,
    deadEnd: (row: number) => `Row ${row} has no column left to try: a dead end. Back to row ${row - 1}.`,
    backtrack: (row: number, col: number, more: boolean) =>
      `Backtrack: take the queen in row ${row} off column ${col}.${more ? " Try the next column." : " That was its last column."}`,
    done: (n: number, choices: number, conflicts: number, backtracks: number) =>
      `All ${n} queens placed, none attacking another. It took ${count(choices, "choice")}, ${count(conflicts, "conflict")} and ${count(backtracks, "backtrack")}.`,
  },
  es: {
    start: (n) =>
      `${n} reinas en un tablero de ${n}×${n}, una por fila. Presiona play: cada fila prueba desde la izquierda.`,
    choice: (row, col, last) =>
      `Fila ${row}, columna ${col} es segura, así que va una reina ahí.${last ? " Era la última fila." : ` Sigue la fila ${row + 1}.`}`,
    conflict: (row, col, by, sameColumn) =>
      `Fila ${row}, columna ${col}: la reina de la fila ${by} la ataca ${sameColumn ? "por la columna" : "en diagonal"}. Un conflicto: se salta.`,
    deadEnd: (row) => `A la fila ${row} no le quedan columnas por probar: un callejón sin salida. Vuelve a la fila ${row - 1}.`,
    backtrack: (row, col, more) =>
      `Vuelta atrás: se quita la reina de la fila ${row}, columna ${col}.${more ? " Se prueba la siguiente columna." : " Era su última columna."}`,
    done: (n, choices, conflicts, backtracks) =>
      `Las ${n} reinas, sin atacarse: ${count(choices, "elección", "elecciones")}, ${count(conflicts, "conflicto")} y ${count(backtracks, "vuelta atrás", "vueltas atrás")}.`,
  },
});

/** The step into frame `index`, in words. */
export const narrateBacktracking = (run: QueensRun, index: number): string => {
  const frame = run.frameAt(index);
  const { event } = frame;
  const n = run.n;
  switch (event.type) {
    case "start":
      return text.start(n);
    case "choice":
      return text.choice(event.row + 1, event.col + 1, event.row === n - 1);
    case "conflict":
      return text.conflict(event.row + 1, event.col + 1, event.by.row + 1, event.by.col === event.col);
    case "deadEnd":
      return text.deadEnd(event.row + 1);
    case "backtrack":
      return text.backtrack(event.row + 1, event.col + 1, event.col < n - 1);
    case "done":
      return text.done(n, frame.choices, frame.conflicts, frame.backtracks);
  }
};

const sudokuText = localized({
  en: {
    start: (empty: number) =>
      `${empty} empty cells. Press play: each one, left to right and top to bottom, tries the digits from 1 to 9.`,
    startFewest: (empty: number) =>
      `${empty} empty cells. Press play: the cell with the fewest digits that fit goes next, and tries them from 1 to 9.`,
    cell: (row: number, col: number) => `Row ${row}, column ${col}`,
    fewest: (where: string, n: number) => `${where} (fewest options: ${n})`,
    choice: (where: string, digit: number) => `${where}: the ${digit} fits.`,
    rule: { row: "its row", column: "its column", box: "its box" } as Record<SudokuRule, string>,
    conflict: (where: string, digit: number, rule: string) => `${where}: the ${digit} is already in ${rule}. A conflict, so skip it.`,
    deadEnd: (row: number, col: number) =>
      `Row ${row}, column ${col} has no digit left to try: a dead end. Back to the cell before.`,
    backtrack: (row: number, col: number, digit: number, more: boolean) =>
      `Backtrack: take the ${digit} out of row ${row}, column ${col}.${more ? " Try the next digit." : " It was the last digit."}`,
    done: (choices: number, conflicts: number, backtracks: number) =>
      `Solved in ${count(choices, "choice")}, ${count(conflicts, "conflict")} and ${count(backtracks, "backtrack")}.`,
    doneFewest: (choices: number, backtracks: number, rowSteps: number, rowBacktracks: number) =>
      `Solved in ${count(choices, "choice")} and ${count(backtracks, "backtrack")}. Row by row: ${count(rowSteps, "step")} and ${count(rowBacktracks, "backtrack")}.`,
  },
  es: {
    start: (empty) =>
      `${empty} casillas vacías. Presiona play: fila por fila, cada una prueba los dígitos del 1 al 9.`,
    startFewest: (empty) =>
      `${empty} casillas vacías. Presiona play: primero la que admite menos dígitos, probando del 1 al 9.`,
    cell: (row, col) => `Fila ${row}, columna ${col}`,
    fewest: (where, n) => `${where} (menos opciones: ${n})`,
    choice: (where, digit) => `${where}: cabe el ${digit}.`,
    rule: { row: "su fila", column: "su columna", box: "su caja" },
    conflict: (where, digit, rule) => `${where}: el ${digit} ya está en ${rule}. Un conflicto: se salta.`,
    deadEnd: (row, col) =>
      `Fila ${row}, columna ${col}: no queda dígito por probar. Callejón sin salida: vuelve a la casilla anterior.`,
    backtrack: (row, col, digit, more) =>
      `Vuelta atrás: se quita el ${digit} de la fila ${row}, columna ${col}.${more ? " Se prueba el siguiente dígito." : " Era el último dígito."}`,
    done: (choices, conflicts, backtracks) =>
      `Resuelto en ${count(choices, "elección", "elecciones")}, ${count(conflicts, "conflicto")} y ${count(backtracks, "vuelta atrás", "vueltas atrás")}.`,
    doneFewest: (choices, backtracks, rowSteps, rowBacktracks) =>
      `Resuelto en ${count(choices, "elección", "elecciones")} y ${count(backtracks, "vuelta atrás", "vueltas atrás")}. Por filas: ${count(rowSteps, "paso")} y ${count(rowBacktracks, "vuelta atrás", "vueltas atrás")}.`,
  },
});

/** A Sudoku step into frame `index`, in words. Rows and columns count from 1, as on the labels. */
export const narrateSudoku = (run: SudokuRun, index: number): string => {
  const frame = run.frameAt(index);
  const { event } = frame;
  if (event.type === "start") return (run.order === "mrv" ? sudokuText.startFewest : sudokuText.start)(run.emptyCount);
  if (event.type === "done") {
    if (run.order !== "mrv") return sudokuText.done(frame.choices, frame.conflicts, frame.backtracks);
    // Fewest options first: next to what row by row would have taken.
    const rows = rowOrderRun(run.puzzle);
    return sudokuText.doneFewest(frame.choices, frame.backtracks, rows.steps, rows.backtracks);
  }
  if (event.type === "backtrack") return sudokuText.backtrack(event.row + 1, event.col + 1, event.digit, event.digit < 9);
  if (event.type === "deadEnd") return sudokuText.deadEnd(event.row + 1, event.col + 1);

  // Fewest options first: the first try in a cell says why that cell was picked.
  let where = sudokuText.cell(event.row + 1, event.col + 1);
  const before = index > 0 ? run.frameAt(index - 1) : null;
  const picked = before && (before.event.type === "start" || before.event.type === "choice");
  const options = before?.options?.[event.row * 9 + event.col];
  if (run.order === "mrv" && picked && options != null) where = sudokuText.fewest(where, options);

  if (event.type === "choice") return sudokuText.choice(where, event.digit);
  return sudokuText.conflict(where, event.digit, sudokuText.rule[event.rule]);
};
