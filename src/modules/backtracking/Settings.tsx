import { useStore } from "@/store";
import { localized } from "@/i18n";
import { Field } from "@/components/Settings/Field";
import { BacktrackingPicker, FillOrderPicker } from "./BacktrackingTools";

const text = localized({
  en: {
    queens: "Queens",
    queensHelp: "The board is as wide as the number of queens. Bigger boards take many more steps.",
    order: "Order",
    orderHelp: "Which empty cell goes next. Fewest options first picks the cell with the fewest digits that fit.",
    puzzle: "Puzzle",
    puzzleHelp: "The same grid with its digits renamed: the hard one takes about seven times as many steps.",
  },
  es: {
    queens: "Reinas",
    queensHelp: "El tablero es tan ancho como el número de reinas. Los tableros grandes llevan muchos más pasos.",
    order: "Orden",
    orderHelp: "Qué casilla vacía va primero. Menos opciones primero elige la casilla a la que le caben menos dígitos.",
    puzzle: "Sudoku",
    puzzleHelp: "La misma cuadrícula con los dígitos cambiados: el difícil lleva unas siete veces más pasos.",
  },
});

/** Backtracking's settings: the board size, or the Sudoku puzzle. */
export const BacktrackingSettings = () => {
  const sudoku = useStore((s) => s.backtracking.problem === "sudoku");
  return (
    <div data-tour="tools" className="flex flex-col gap-6">
      <Field label={sudoku ? text.puzzle : text.queens} help={sudoku ? text.puzzleHelp : text.queensHelp}>
        <BacktrackingPicker />
      </Field>
      {sudoku && (
        <Field label={text.order} help={text.orderHelp}>
          <FillOrderPicker />
        </Field>
      )}
    </div>
  );
};
