import { localized } from "@/i18n";
import { Field } from "@/components/Settings/Field";
import { GraphPresetButtons, GraphSizePicker } from "./GraphTools";

const text = localized({
  en: {
    size: "Size",
    freshLayout: "A new size starts a fresh layout of the same kind.",
    layout: "Layout",
    graphLayoutHelp: "Drag a node to move it, tap two nodes to join or split them, double-tap a node to start there.",
  },
  es: {
    size: "Tamaño",
    freshLayout: "Un tamaño nuevo empieza una disposición nueva del mismo tipo.",
    layout: "Disposición",
    graphLayoutHelp: "Arrastra un nodo para moverlo, toca dos nodos para unirlos o separarlos, toca dos veces un nodo para empezar ahí.",
  },
});

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
