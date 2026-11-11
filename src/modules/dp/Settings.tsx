import { useStore } from "@/store";
import { localized } from "@/i18n";
import { Field } from "@/components/Settings/Field";
import { ItemsControls } from "./DpStage";
import { DpStartPicker } from "./DpTools";

const text = localized({
  en: {
    bag: "Bag and items",
    bagHelp: "Items are named A, B, C… in order, each with its weight and value.",
    example: "Example",
    exampleWords: "Example words",
    exampleWordsHelp: "Or type any two words under the table, up to 10 letters each.",
  },
  es: {
    bag: "Mochila y objetos",
    bagHelp: "Los objetos se llaman A, B, C… en orden, cada uno con su peso y su valor.",
    example: "Ejemplo",
    exampleWords: "Palabras de ejemplo",
    exampleWordsHelp: "O escribe dos palabras cualesquiera bajo la tabla, de hasta 10 letras cada una.",
  },
});

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
