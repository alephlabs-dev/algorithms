import type { QueensRun } from "@/backtracking";
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
      `${n} reinas en un tablero de ${n}×${n}, una por fila. Presiona play: cada fila prueba sus columnas desde la izquierda.`,
    choice: (row, col, last) =>
      `Fila ${row}, columna ${col} es segura, así que va una reina ahí.${last ? " Era la última fila." : ` Sigue la fila ${row + 1}.`}`,
    conflict: (row, col, by, sameColumn) =>
      `Fila ${row}, columna ${col}: la reina de la fila ${by} la ataca ${sameColumn ? "por la columna" : "en diagonal"}. Un conflicto: se salta.`,
    deadEnd: (row) => `A la fila ${row} no le quedan columnas por probar: un callejón sin salida. Vuelve a la fila ${row - 1}.`,
    backtrack: (row, col, more) =>
      `Vuelta atrás: se quita la reina de la fila ${row}, columna ${col}.${more ? " Se prueba la siguiente columna." : " Era su última columna."}`,
    done: (n, choices, conflicts, backtracks) =>
      `Las ${n} reinas están colocadas y ninguna ataca a otra. Hicieron falta ${count(choices, "elección", "elecciones")}, ${count(conflicts, "conflicto")} y ${count(backtracks, "vuelta atrás", "vueltas atrás")}.`,
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
