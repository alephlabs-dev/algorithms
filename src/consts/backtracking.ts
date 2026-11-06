import { localized } from "@/i18n";
import type { BacktrackingProblem, FillOrder, SudokuPuzzle } from "@/backtracking";

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
    sudoku: {
      title: "Sudoku",
      named: "a Sudoku",
      short: "Sudoku",
      shortDescription:
        "Fill a 9×9 grid so every row, column and 3×3 box holds 1 to 9 once: one empty cell at a time, taking a digit back whenever a cell has nothing left to try.",
      longDescription:
        "A Sudoku starts with some digits already in place, the givens. The rest of the 81 cells must be filled so that every row, every column and every 3×3 box holds each digit from 1 to 9 exactly once. Backtracking walks the empty cells in reading order, left to right and top to bottom. In each one it tries the digits from 1 to 9, and skips any digit already in that cell's row, column or box (a conflict). When a digit fits, it's written in and the search moves to the next empty cell. When a cell has no digit left to try (a dead end), the digit in the cell before is taken back and its next digit is tried. Trying every way to fill m empty cells would mean 9ᵐ grids, more than there are atoms in the universe for a typical puzzle; checking the rules as each digit goes in leaves a few hundred to a few thousand steps. Wikipedia's example puzzle takes over forty thousand, though: how long the search runs depends on the order the cells and digits are tried in, which is why real solvers fill the cell with the fewest options first.",
      cost: "O(9ᵐ) worst case, m = empty cells",
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
    sudoku: {
      title: "Sudoku",
      named: "un sudoku",
      short: "Sudoku",
      shortDescription:
        "Llena una cuadrícula de 9×9 de modo que cada fila, columna y caja de 3×3 tenga del 1 al 9 una sola vez: casilla por casilla, quitando un dígito cada vez que una casilla se queda sin nada que probar.",
      longDescription:
        "Un sudoku empieza con algunos dígitos ya puestos, las pistas. Las demás de las 81 casillas hay que llenarlas de modo que cada fila, cada columna y cada caja de 3×3 tenga cada dígito del 1 al 9 exactamente una vez. El backtracking recorre las casillas vacías en orden de lectura, de izquierda a derecha y de arriba abajo. En cada una prueba los dígitos del 1 al 9 y salta cualquier dígito que ya esté en su fila, su columna o su caja (un conflicto). Cuando un dígito cabe, lo escribe y pasa a la siguiente casilla vacía. Cuando a una casilla no le quedan dígitos por probar (un callejón sin salida), quita el dígito de la casilla anterior y prueba su siguiente dígito. Probar todas las formas de llenar m casillas vacías serían 9ᵐ cuadrículas, más que átomos en el universo para un sudoku típico; comprobar las reglas con cada dígito deja entre unos cientos y unos miles de pasos. El sudoku de ejemplo de Wikipedia, eso sí, lleva más de cuarenta mil: cuánto dura la búsqueda depende del orden en que se prueban casillas y dígitos, y por eso los programas de verdad llenan primero la casilla con menos opciones.",
      cost: "O(9ᵐ) en el peor caso, m = casillas vacías",
    },
  },
});

export const backtrackingProblems: Record<BacktrackingProblem, ProblemText> = text;

/** How many ways there are to place N queens, for the board sizes the module offers. */
export const QUEENS_SOLUTIONS: Record<number, number> = { 4: 2, 5: 10, 6: 4, 7: 40, 8: 92 };

/** The Sudoku puzzles' names, in the picker and the settings button. */
export const sudokuPuzzleNames = localized<Record<SudokuPuzzle, string>>({
  en: { easy: "Easy", hard: "Hard" },
  es: { easy: "Fácil", hard: "Difícil" },
});

/** The fill orders' names, in the picker and the settings button. */
export const fillOrderNames = localized<Record<FillOrder, string>>({
  en: { rows: "Row by row", mrv: "Fewest options" },
  es: { rows: "Por filas", mrv: "Menos opciones" },
});
