import { localized } from "@/i18n";
import type { TourStep } from "@/modules/types";

// The guided tour: which control to light up, and what to say about it.

export const backtrackingTour = localized<TourStep[]>({
  en: [
    {
      anchor: "picker",
      title: "Pick a problem",
      text: () =>
        "N-Queens (place queens so none attacks another) or Sudoku (fill the grid so no row, column or box repeats a digit).",
    },
    {
      anchor: "bars",
      title: "The board",
      text: () =>
        "A queen per row, or a digit per empty cell, tried one after another. A red square is a conflict: the dashed line points at what rules it out.",
    },
    {
      anchor: "choices",
      title: "The choices that stand",
      text: () =>
        "Each queen or digit placed so far. It grows with every choice, and shrinks when a square has nothing left to try and the search backtracks.",
    },
    {
      anchor: "narration",
      title: "Follow along",
      text: ({ wide }) =>
        wide
          ? "The code it's running, and each step in plain words."
          : "Each step in plain words. Tap it to see the code.",
    },
    {
      anchor: "tools",
      phoneAnchor: "settings",
      title: "Your board",
      text: ({ phone }) =>
        `${phone ? "In settings: from" : "From"} 4 to 8 queens, or an easy or hard Sudoku. Bigger boards and harder puzzles take far more steps.`,
    },
    {
      anchor: "game",
      title: "A guessing game",
      text: () =>
        "With N-Queens, pick Guess and playback stops before a queen lands to ask which column it takes, or whether the row is a dead end. It keeps score.",
    },
  ],
  es: [
    {
      anchor: "picker",
      title: "Elige un problema",
      text: () =>
        "N reinas (coloca reinas sin que ninguna ataque a otra) o sudoku (llena la cuadrícula sin repetir un dígito en una fila, columna o caja).",
    },
    {
      anchor: "bars",
      title: "El tablero",
      text: () =>
        "Una reina por fila, o un dígito por casilla vacía, probados uno tras otro. Una casilla roja es un conflicto: la línea discontinua señala lo que la descarta.",
    },
    {
      anchor: "choices",
      title: "Las elecciones en pie",
      text: () =>
        "Cada reina o dígito colocado hasta ahora. Crece con cada elección y se acorta cuando una casilla se queda sin nada que probar y la búsqueda vuelve atrás.",
    },
    {
      anchor: "narration",
      title: "Síguelo",
      text: ({ wide }) =>
        wide ? "El código que ejecuta y cada paso en palabras simples." : "Cada paso en palabras simples. Tócalo para ver el código.",
    },
    {
      anchor: "tools",
      phoneAnchor: "settings",
      title: "Tu tablero",
      text: ({ phone }) =>
        `${phone ? "En los ajustes: de" : "De"} 4 a 8 reinas, o un sudoku fácil o difícil. Los tableros grandes y los sudokus difíciles llevan muchos más pasos.`,
    },
    {
      anchor: "game",
      title: "Un juego de adivinar",
      text: () =>
        "Con N reinas, elige Adivina y la reproducción se detiene antes de que caiga una reina para preguntarte en qué columna cae, o si la fila es un callejón sin salida. Lleva el puntaje.",
    },
  ],
});
