import { BarChartIcon } from "@radix-ui/react-icons";
import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
// eslint-disable-next-line house/module-boundaries -- TODO(#190): the Sorting settings move into its interface.
import { inputOrders } from "@/modules/sorting/inputOrders";
// eslint-disable-next-line house/module-boundaries -- TODO(#190): the Sorting settings move into its interface.
import { sizesFor } from "@/modules/sorting/sizesMap";
import { useStore } from "@/store";
// eslint-disable-next-line house/module-boundaries -- TODO(#190): the Sorting settings move into its interface.
import type { DisplayMode, InputOrder } from "@/modules/sorting/types";
// eslint-disable-next-line house/module-boundaries -- TODO(#190): the DP settings move into its interface.
import { ItemsControls } from "@/modules/dp/DpStage";
// eslint-disable-next-line house/module-boundaries -- TODO(#190): the DP settings move into its interface.
import { DpStartPicker } from "@/modules/dp/DpTools";
// eslint-disable-next-line house/module-boundaries -- TODO(#190): the Backtracking settings move into its interface.
import { BacktrackingPicker, FillOrderPicker } from "@/modules/backtracking/BacktrackingTools";
// eslint-disable-next-line house/module-boundaries -- TODO(#190): the Fourier settings move into its interface.
import { CirclesPicker, DrawingSelect } from "@/modules/fourier/FourierTools";
// eslint-disable-next-line house/module-boundaries -- TODO(#190): the Data structures settings move into its interface.
import { StructurePresetButtons, StructureSizePicker } from "@/modules/structures/StructureTools";
// eslint-disable-next-line house/module-boundaries -- TODO(#190): the Graphs settings move into its interface.
import { GraphPresetButtons, GraphSizePicker } from "@/modules/graphs/GraphTools";
// eslint-disable-next-line house/module-boundaries -- TODO(#190): the Mazes settings move into its interface.
import { MazeSizePicker } from "@/modules/mazes/MazeTools";
// eslint-disable-next-line house/module-boundaries -- TODO(#190): the Pathfinding settings move into its interface.
import { BrushPicker, GridSizePicker, PresetButtons } from "@/modules/pathfinding/PathTools";
import { NativeSelect } from "../ui/native-select";
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
    mazeSize: "Maze size",
    mazeSizeHelp: "Bigger mazes take longer to carve and show their texture better. New maze keeps the size.",
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
    mazeSize: "Tamaño del laberinto",
    mazeSizeHelp: "Los laberintos grandes tardan más en excavarse y muestran mejor su textura. Laberinto nuevo mantiene el tamaño.",
  },
});

const useSettings = () =>
  useStore(
    useShallow((s) => ({
      size: s.sorting.size,
      setSize: s.actions.sorting.setSize,
      inputOrder: s.sorting.inputOrder,
      setInputOrder: s.actions.sorting.setInputOrder,
      displayMode: s.sorting.displayMode,
      setDisplayMode: s.actions.sorting.setDisplayMode,
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

/** How the array starts out, as one closed field; the field's help says what the chosen order is for. */
const InputPicker = () => {
  const s = useSettings();
  return (
    <NativeSelect
      label={text.input}
      value={s.inputOrder}
      onChange={(order) => {
        if (order !== s.inputOrder) s.setInputOrder(order as InputOrder);
      }}
      groups={[
        {
          options: (Object.keys(inputOrders) as InputOrder[]).map((order) => ({
            value: order,
            label: inputOrders[order].label,
          })),
        },
      ]}
    />
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

/** One setting with its name above and help below. `tour` lets a tour step point at it. */
export const Field = ({
  label,
  help,
  tour,
  children,
}: {
  label: string;
  help?: string;
  tour?: string;
  children: ReactNode;
}) => (
  <div data-tour={tour} className="flex flex-col gap-2">
    <h3 className="text-sm font-semibold text-foreground">{label}</h3>
    {children}
    {help && <p className="text-xs text-foreground/70">{help}</p>}
  </div>
);

// Each module's settings, stacked for the settings sheet and panel. Where the panel
// replaces a module's tools row (iPad landscape and desktop), the same controls carry
// its "tools" tour anchor. Help is plain text since tooltips don't work on touch.

/** Data structures' settings: how many values the tree starts with, in which order. */
export const StructureSettings = () => (
  <div className="flex flex-col gap-6">
    <Field label={text.startingValues} help={text.startingValuesHelp} tour="tools">
      <StructurePresetButtons />
    </Field>
    <Field label={text.howMany} help={text.howManyHelp}>
      <StructureSizePicker />
    </Field>
  </div>
);

/** Dynamic programming's settings: example words (any two can be typed under the table). */
export const DpSettings = () => {
  const bag = useStore((s) => s.dp.algorithm === "knapsack" || s.view === "race");
  return bag ? (
    <div className="flex flex-col gap-6">
      <Field label={text.bag} help={text.bagHelp}>
        <ItemsControls className="flex flex-wrap items-center gap-x-5 gap-y-3" />
      </Field>
      <Field label={text.example} tour="tools">
        <DpStartPicker />
      </Field>
    </div>
  ) : (
    <Field label={text.exampleWords} help={text.exampleWordsHelp} tour="tools">
      <DpStartPicker />
    </Field>
  );
};

/** Fourier's settings: how many circles, and for epicycles which drawing. */
export const FourierSettings = () => {
  const wave = useStore((s) => s.fourier.algorithm !== "epicycles");
  return (
    <div data-tour="tools" className="flex flex-col gap-6">
      <Field label={text.circles} help={text.circlesHelp}>
        <CirclesPicker />
      </Field>
      {!wave && (
        <Field label={text.drawing} help={text.drawingHelp}>
          <DrawingSelect />
        </Field>
      )}
    </div>
  );
};

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

/** Graphs' settings: how many nodes and what kind of layout "new layout" makes. */
export const GraphSettings = () => (
  <div className="flex flex-col gap-6">
    <Field label={text.size} help={text.freshLayout}>
      <GraphSizePicker />
    </Field>
    <Field label={text.layout} help={text.graphLayoutHelp} tour="tools">
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
    <div data-tour="tools" className="flex flex-col gap-6">
      <Field label={text.brush} help={text.brushHelp}>
        <BrushPicker />
      </Field>
      <Field label={text.layout}>
        <PresetButtons />
      </Field>
    </div>
  </div>
);

/** Mazes' settings: the size is the only one. */
export const MazeSettings = () => (
  <Field label={text.mazeSize} help={text.mazeSizeHelp} tour="tools">
    <MazeSizePicker />
  </Field>
);

/** Sorting's settings: array size, how it starts out and how it's drawn. */
export const SortingSettings = () => {
  const s = useSettings();
  return (
    <div className="flex flex-col gap-6">
      <Field label={text.arraySize} help={sizeHelp(Math.max(...sizesFor("numbers", s.isMobile)))}>
        <SizePicker />
      </Field>
      <Field label={text.input} help={inputOrders[s.inputOrder].description}>
        <InputPicker />
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
