import { BarChartIcon } from "@radix-ui/react-icons";
import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { inputOrders } from "@/consts/inputOrders";
import { NUMBERS_LIMIT, sizesFor } from "@/consts/sizesMap";
import { useStore } from "@/store";
import type { DisplayMode, InputOrder } from "@/types";
import { ItemsControls } from "../Dp/DpStage";
import { DpStartPicker } from "../Dp/DpTools";
import { BacktrackingPicker, FillOrderPicker } from "../Backtracking/BacktrackingTools";
import { CirclesPicker, ShapeGrid } from "../Fourier/FourierTools";
import { StructurePresetButtons, StructureSizePicker } from "../Structures/StructureTools";
import { GraphPresetButtons, GraphSizePicker } from "../Graphs/GraphTools";
import { BrushPicker, GridSizePicker, PresetButtons } from "../Pathfinding/PathTools";
import { ListItem } from "../ui/list-item";
import { SegmentedControl } from "../ui/segmented";
import { StepSlider } from "../ui/slider";
import { localized } from "@/i18n";

const text = localized({
  en: {
    sizeHelp: (limit: number) =>
      `How many items to sort. Small arrays are easier to follow; large ones show how algorithms scale. Numbers mode fits up to ${limit}.`,
    displayHelp: "Bars show values as heights; numbers show the values themselves, for small arrays.",
    items: (size: number) => `${size} items`,
    arraySize: "Array size",
    input: "Input",
    display: "Display",
    bars: "Bars",
    numbers: "Numbers",
    startingValues: "Starting values",
    startingValuesHelp: "Ascending values show why balancing matters: a plain BST turns into a list.",
    howMany: "How many",
    howManyHelp: "A new size starts a fresh tree. Insert, search and delete with the bar under the tree.",
    bag: "Bag and items",
    bagHelp: "Items are named A, B, C… in order, each with its weight and value.",
    example: "Example",
    exampleWords: "Example words",
    exampleWordsHelp: "Or type any two words under the table, up to 10 letters each.",
    circles: "Circles",
    circlesHelp: "More circles, closer to the goal. Jumps and corners need the most.",
    queens: "Queens",
    queensHelp: "The board is as wide as the number of queens. Bigger boards take many more steps.",
    order: "Order",
    orderHelp: "Which empty cell goes next. Fewest options first picks the cell with the fewest digits that fit.",
    puzzle: "Puzzle",
    puzzleHelp: "The same grid with its digits renamed: the hard one takes about seven times as many steps.",
    drawing: "Drawing",
    drawingHelp: "“Draw your own” turns the stage into a canvas: draw a shape in one stroke.",
    size: "Size",
    freshLayout: "A new size starts a fresh layout of the same kind.",
    layout: "Layout",
    graphLayoutHelp: "Drag a node to move it, tap two nodes to join or split them, double-tap a node to start there.",
    gridSize: "Grid size",
    brush: "Brush",
    brushHelp: "Drag on the grid to paint; start on a painted cell to erase. Drag the start or target to move them.",
  },
  es: {
    sizeHelp: (limit) =>
      `Cuántos elementos ordenar. Los arreglos pequeños se siguen mejor; los grandes muestran cómo escala cada algoritmo. El modo números admite hasta ${limit}.`,
    displayHelp: "Las barras muestran los valores como alturas; los números muestran los valores mismos, para arreglos pequeños.",
    items: (size) => `${size} elementos`,
    arraySize: "Tamaño del arreglo",
    input: "Orden inicial",
    display: "Vista",
    bars: "Barras",
    numbers: "Números",
    startingValues: "Valores iniciales",
    startingValuesHelp: "Los valores ascendentes muestran por qué importa balancear: un BST simple se vuelve una lista.",
    howMany: "Cuántos",
    howManyHelp: "Un tamaño nuevo empieza un árbol nuevo. Inserta, busca y borra con la barra bajo el árbol.",
    bag: "Mochila y objetos",
    bagHelp: "Los objetos se llaman A, B, C… en orden, cada uno con su peso y su valor.",
    example: "Ejemplo",
    exampleWords: "Palabras de ejemplo",
    exampleWordsHelp: "O escribe dos palabras cualesquiera bajo la tabla, de hasta 10 letras cada una.",
    circles: "Círculos",
    circlesHelp: "Más círculos, más cerca del objetivo. Los saltos y las esquinas necesitan más.",
    queens: "Reinas",
    queensHelp: "El tablero es tan ancho como el número de reinas. Los tableros grandes llevan muchos más pasos.",
    order: "Orden",
    orderHelp: "Qué casilla vacía va primero. Menos opciones primero elige la casilla a la que le caben menos dígitos.",
    puzzle: "Sudoku",
    puzzleHelp: "La misma cuadrícula con los dígitos cambiados: el difícil lleva unas siete veces más pasos.",
    drawing: "Dibujo",
    drawingHelp: "“Dibuja el tuyo” convierte el escenario en un lienzo: dibuja una figura de un solo trazo.",
    size: "Tamaño",
    freshLayout: "Un tamaño nuevo empieza una disposición nueva del mismo tipo.",
    layout: "Disposición",
    graphLayoutHelp: "Arrastra un nodo para moverlo, toca dos nodos para unirlos o separarlos, toca dos veces un nodo para empezar ahí.",
    gridSize: "Tamaño de la cuadrícula",
    brush: "Pincel",
    brushHelp: "Arrastra sobre la cuadrícula para pintar; empieza en una celda pintada para borrar. Arrastra el inicio o el destino para moverlos.",
  },
});

const useSettings = () =>
  useStore(
    useShallow((s) => ({
      size: s.size,
      setSize: s.setSize,
      inputOrder: s.inputOrder,
      setInputOrder: s.setInputOrder,
      displayMode: s.displayMode,
      setDisplayMode: s.setDisplayMode,
      isMobile: s.isMobile,
      isRace: s.view === "race",
    }))
  );

const sizeHelp = text.sizeHelp;
const displayHelp = text.displayHelp;

// The pickers: shared by the phone settings sheet and the desktop toolbar.

const SizePicker = () => {
  const s = useSettings();
  return (
    <StepSlider
      label={text.arraySize}
      values={sizesFor(s.displayMode, s.isMobile)}
      value={s.size}
      onChange={s.setSize}
      valueText={text.items}
    />
  );
};

/** Each input order with what it's for, so the choice explains itself. */
const InputList = () => {
  const s = useSettings();
  return (
    <div role="radiogroup" aria-label={text.input} className="flex flex-col gap-1">
      {(Object.keys(inputOrders) as InputOrder[]).map((order) => (
        <ListItem
          key={order}
          role="radio"
          aria-checked={order === s.inputOrder}
          aria-pressed={undefined}
          selected={order === s.inputOrder}
          onClick={() => {
            if (order !== s.inputOrder) s.setInputOrder(order);
          }}
          className="flex-col items-start gap-0.5 py-2"
        >
          <span>{inputOrders[order].label}</span>
          <span className="text-xs font-normal text-foreground/60">{inputOrders[order].description}</span>
        </ListItem>
      ))}
    </div>
  );
};

const DisplayPicker = () => {
  const s = useSettings();
  return (
    <SegmentedControl<DisplayMode>
      label={text.display}
      options={[
        { value: "bars", label: <><BarChartIcon /> {text.bars}</> },
        { value: "numbers", label: <><span className="font-mono text-xs">123</span> {text.numbers}</> },
      ]}
      value={s.displayMode}
      onChange={(mode) => mode !== s.displayMode && s.setDisplayMode(mode)}
    />
  );
};

const Field = ({ label, help, children }: { label: string; help?: string; children: ReactNode }) => (
  <div className="flex flex-col gap-2">
    <h3 className="text-sm font-semibold text-foreground">{label}</h3>
    {children}
    {help && <p className="text-xs text-foreground/70">{help}</p>}
  </div>
);

// Each module's settings, stacked for the settings sheet and menu. Help is plain text since tooltips don't work on touch.

/** Data structures' settings: how many values the tree starts with, in which order. */
export const StructureSettings = () => (
  <div className="flex flex-col gap-6">
    <Field label={text.startingValues} help={text.startingValuesHelp}>
      <StructurePresetButtons />
    </Field>
    <Field label={text.howMany} help={text.howManyHelp}>
      <StructureSizePicker />
    </Field>
  </div>
);

/** Dynamic programming's settings: example words (any two can be typed under the table). */
export const DpSettings = () => {
  const bag = useStore((s) => s.dpAlgorithm === "knapsack" || s.view === "race");
  return bag ? (
    <div className="flex flex-col gap-6">
      <Field label={text.bag} help={text.bagHelp}>
        <ItemsControls className="flex flex-wrap items-center gap-x-5 gap-y-3" />
      </Field>
      <Field label={text.example}>
        <DpStartPicker />
      </Field>
    </div>
  ) : (
    <Field label={text.exampleWords} help={text.exampleWordsHelp}>
      <DpStartPicker />
    </Field>
  );
};

/** Fourier's settings: how many circles, and for epicycles which drawing. */
export const FourierSettings = () => {
  const wave = useStore((s) => s.fourierAlgorithm !== "epicycles");
  return (
    <div className="flex flex-col gap-6">
      <Field label={text.circles} help={text.circlesHelp}>
        <CirclesPicker />
      </Field>
      {!wave && (
        <Field label={text.drawing} help={text.drawingHelp}>
          <ShapeGrid />
        </Field>
      )}
    </div>
  );
};

/** Backtracking's settings: the board size, or the Sudoku puzzle. */
export const BacktrackingSettings = () => {
  const sudoku = useStore((s) => s.backtrackingProblem === "sudoku");
  return (
    <div className="flex flex-col gap-6">
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

/** Graphs' settings: how many nodes and what kind of layout "new layout" makes. */
export const GraphSettings = () => (
  <div className="flex flex-col gap-6">
    <Field label={text.size} help={text.freshLayout}>
      <GraphSizePicker />
    </Field>
    <Field label={text.layout} help={text.graphLayoutHelp}>
      <GraphPresetButtons />
    </Field>
  </div>
);

/** Pathfinding's settings: grid size, brush and layouts. */
export const PathSettings = () => (
  <div className="flex flex-col gap-6">
    <Field label={text.gridSize} help={text.freshLayout}>
      <GridSizePicker />
    </Field>
    <Field label={text.brush} help={text.brushHelp}>
      <BrushPicker />
    </Field>
    <Field label={text.layout}>
      <PresetButtons />
    </Field>
  </div>
);

/** Sorting's settings: array size, how it starts out and how it's drawn. */
export const SortingSettings = () => {
  const s = useSettings();
  return (
    <div className="flex flex-col gap-6">
      <Field label={text.arraySize} help={sizeHelp(s.isMobile ? NUMBERS_LIMIT.mobile : NUMBERS_LIMIT.desktop)}>
        <SizePicker />
      </Field>
      <Field label={text.input}>
        <InputList />
      </Field>
      {/* Race lanes always draw bars. */}
      {!s.isRace && (
        <Field label={text.display} help={displayHelp}>
          <DisplayPicker />
        </Field>
      )}
    </div>
  );
};
