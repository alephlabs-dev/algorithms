import { localized } from "@/i18n";
import { Field } from "@/components/Settings/Field";
import { BrushPicker, GridSizePicker, PresetButtons } from "./PathTools";

const text = localized({
  en: {
    gridSize: "Grid size",
    freshLayout: "A new size starts a fresh layout of the same kind.",
    brush: "Brush",
    brushHelp: "Drag on the grid to paint; start on a painted cell to erase. Drag the start or target to move them.",
    layout: "Layout",
  },
  es: {
    gridSize: "Tamaño de la cuadrícula",
    freshLayout: "Un tamaño nuevo empieza una disposición nueva del mismo tipo.",
    brush: "Pincel",
    brushHelp: "Arrastra sobre la cuadrícula para pintar; empieza en una celda pintada para borrar. Arrastra el inicio o el destino para moverlos.",
    layout: "Disposición",
  },
});

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
