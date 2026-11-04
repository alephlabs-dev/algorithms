import { BarChartIcon } from "@radix-ui/react-icons";
import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { inputOrders } from "@/consts/inputOrders";
import { MAX_MOBILE_SIZE, sizes } from "@/consts/sizesMap";
import { useStore } from "@/store";
import type { DisplayMode, InputOrder } from "@/types";
import { InfoTip } from "../ui/info-tip";
import { SegmentedControl } from "../ui/segmented";

type Layout = "sidebar" | "drawer";

/** A setting with its label. Help is a tooltip in the sidebar and plain text in the drawer, since tooltips don't work on touch. */
const Field = ({ label, help, layout, children }: { label: string; help: string; layout: Layout; children: ReactNode }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      {layout === "sidebar" && <InfoTip title={label} content={help} />}
    </div>
    {children}
    {layout === "drawer" && <p className="text-xs text-foreground/70">{help}</p>}
  </div>
);

const NUMBERS_LIMIT = { desktop: 20, mobile: 10 };

/** Array size, input and display mode. Shared by the desktop sidebar and the phone drawer. */
export const SettingsPanel = ({ layout }: { layout: Layout }) => {
  const s = useStore(
    useShallow((s) => ({
      size: s.size,
      setSize: s.setSize,
      inputOrder: s.inputOrder,
      setInputOrder: s.setInputOrder,
      displayMode: s.displayMode,
      setDisplayMode: s.setDisplayMode,
      isMobile: s.isMobile,
      isPlaying: s.isPlaying,
      isRace: s.view === "race",
    }))
  );
  const numbersLimit = s.isMobile ? NUMBERS_LIMIT.mobile : NUMBERS_LIMIT.desktop;
  const sizeOptions = sizes
    .filter((size) => !s.isMobile || size <= MAX_MOBILE_SIZE)
    .map((size) => ({
      value: size,
      label: <span className="font-mono">{size}</span>,
      title: `${size} items`,
      disabled: s.displayMode === "numbers" && size > numbersLimit,
    }));
  const inputDescription = inputOrders[s.inputOrder].description;

  return (
    <div className="flex flex-col gap-6">
      <Field
        label="Array size"
        layout={layout}
        help={`How many items to sort. Small arrays are easier to follow; large ones show how algorithms scale. Numbers mode fits up to ${numbersLimit}.`}
      >
        <SegmentedControl
          label="Array size"
          options={sizeOptions}
          value={s.size}
          onChange={(size) => size !== s.size && s.setSize(size)}
          disabled={s.isPlaying}
          columns={layout === "drawer" && sizeOptions.length > 5 ? 3 : undefined}
          compact={layout === "sidebar"}
        />
      </Field>

      <Field label="Input" layout={layout} help={inputDescription}>
        <SegmentedControl<InputOrder>
          label="Input"
          options={(Object.keys(inputOrders) as InputOrder[]).map((order) => ({
            value: order,
            label: inputOrders[order].label,
          }))}
          value={s.inputOrder}
          onChange={(order) => s.setInputOrder(order)}
          disabled={s.isPlaying}
          columns={layout === "drawer" ? 2 : 3}
          compact={layout === "sidebar"}
        />
      </Field>

      {/* Race lanes always draw bars. */}
      {!s.isRace && (
        <Field
          label="Display"
          layout={layout}
          help="Bars show values as heights; numbers show the values themselves, for small arrays."
        >
          <SegmentedControl<DisplayMode>
            label="Display"
            options={[
              { value: "bars", label: <><BarChartIcon /> Bars</> },
              { value: "numbers", label: <><span className="font-mono text-xs">123</span> Numbers</> },
            ]}
            value={s.displayMode}
            onChange={(mode) => mode !== s.displayMode && s.setDisplayMode(mode)}
            disabled={s.isPlaying}
            compact={layout === "sidebar"}
          />
        </Field>
      )}
    </div>
  );
};
