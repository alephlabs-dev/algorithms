import { localized } from "@/i18n";
import { Field } from "@/components/Settings/Field";
import { StructurePresetButtons, StructureSizePicker } from "./StructureTools";

const text = localized({
  en: {
    startingValues: "Starting values",
    startingValuesHelp: "Ascending values show why balancing matters: a plain BST turns into a list.",
    howMany: "How many",
    howManyHelp: "A new size starts a fresh tree. Insert, search and delete with the bar under the tree.",
  },
  es: {
    startingValues: "Valores iniciales",
    startingValuesHelp: "Los valores ascendentes muestran por qué importa balancear: un BST simple se vuelve una lista.",
    howMany: "Cuántos",
    howManyHelp: "Un tamaño nuevo empieza un árbol nuevo. Inserta, busca y borra con la barra bajo el árbol.",
  },
});

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
