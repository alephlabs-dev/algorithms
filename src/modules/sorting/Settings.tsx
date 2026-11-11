import { BarChartIcon } from "@radix-ui/react-icons";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { localized } from "@/i18n";
import { Field } from "@/components/Settings/Field";
import { NativeSelect } from "@/components/ui/native-select";
import { SegmentedControl } from "@/components/ui/segmented";
import { StepSlider } from "@/components/ui/slider";
import { inputOrders } from "./inputOrders";
import { sizesFor } from "./sizesMap";
import type { DisplayMode, InputOrder } from "./types";

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
