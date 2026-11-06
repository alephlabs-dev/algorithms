import { localized } from "@/i18n";
import type { BacktrackingProblem } from "@/backtracking";

type ProblemText = {
  title: string;
  /** How the name reads mid-sentence ("How … works"). */
  named: string;
  /** Short name for tight spots (pickers on phones). */
  short: string;
  shortDescription: string;
  longDescription: string;
  /** Worst-case time and space. */
  cost: string;
};

// Key order is the order shown in the UI.
const text = localized<Record<BacktrackingProblem, ProblemText>>({
  en: {
    queens: {
      title: "N-Queens",
      named: "the N-Queens puzzle",
      short: "N-Queens",
      shortDescription:
        "Place N queens on an N×N board so no two attack each other: one row at a time, taking a queen back whenever a row has nowhere left to go.",
      longDescription:
        "A chess queen attacks along her row, her column and both diagonals. The puzzle asks for N queens on an N×N board with no two attacking each other, so there must be exactly one per row. Backtracking fills the rows from the top: in each row it tries the columns from the left, and skips any square a queen above already attacks (a conflict). When it finds a safe square it places the queen and moves down a row. When a row has no column left to try (a dead end), it takes back the queen above and tries her next column. Trying every way to put one queen in each row would mean Nᴺ boards; skipping attacked squares as soon as they show up cuts that down to about a thousand steps for 8 queens. The same idea solves Sudoku, crosswords and timetables: build a solution one choice at a time and undo the last choice as soon as it can't work.",
      cost: "O(N!) worst case · O(N) space",
    },
  },
  es: {
    queens: {
      title: "N reinas",
      named: "el problema de las N reinas",
      short: "N reinas",
      shortDescription:
        "Coloca N reinas en un tablero de N×N sin que ninguna ataque a otra: fila por fila, quitando una reina cada vez que una fila se queda sin casillas.",
      longDescription:
        "Una reina de ajedrez ataca a lo largo de su fila, su columna y sus dos diagonales. El problema pide N reinas en un tablero de N×N sin que ninguna ataque a otra, así que tiene que haber exactamente una por fila. El backtracking llena las filas desde arriba: en cada fila prueba las columnas desde la izquierda y salta cualquier casilla que ya ataque una reina de arriba (un conflicto). Cuando encuentra una casilla segura, coloca la reina y baja a la fila siguiente. Cuando a una fila no le quedan columnas por probar (un callejón sin salida), quita la reina de arriba y prueba su siguiente columna. Probar todas las formas de poner una reina en cada fila serían Nᴺ tableros; saltar las casillas atacadas en cuanto aparecen lo reduce a unos mil pasos para 8 reinas. La misma idea resuelve sudokus, crucigramas y horarios: construir una solución elección por elección y deshacer la última en cuanto deja de servir.",
      cost: "O(N!) en el peor caso · O(N) de espacio",
    },
  },
});

export const backtrackingProblems: Record<BacktrackingProblem, ProblemText> = text;

/** How many ways there are to place N queens, for the board sizes the module offers. */
export const QUEENS_SOLUTIONS: Record<number, number> = { 4: 2, 5: 10, 6: 4, 7: 40, 8: 92 };
