import { BarChartIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { inputOrders } from "@/consts/inputOrders";
import { MAX_MOBILE_SIZE, sizes } from "@/consts/sizesMap";
import { useStore } from "@/store";
import type { DisplayMode, InputOrder } from "@/types";
import { cn } from "@/utils/cn";
import { ListItem } from "../ui/list-item";
import { SegmentedControl } from "../ui/segmented";

const NUMBERS_LIMIT = { desktop: 20, mobile: 10 };

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

const sizeHelp = (limit: number) =>
  `How many items to sort. Small arrays are easier to follow; large ones show how algorithms scale. Numbers mode fits up to ${limit}.`;
const displayHelp = "Bars show values as heights; numbers show the values themselves, for small arrays.";

// The pickers: shared by the phone settings sheet and the desktop toolbar.

const SizePicker = () => {
  const s = useSettings();
  const limit = s.isMobile ? NUMBERS_LIMIT.mobile : NUMBERS_LIMIT.desktop;
  const options = sizes
    .filter((size) => !s.isMobile || size <= MAX_MOBILE_SIZE)
    .map((size) => ({
      value: size,
      label: <span className="font-mono">{size}</span>,
      title: `${size} items`,
      disabled: s.displayMode === "numbers" && size > limit,
    }));
  return (
    <SegmentedControl
      label="Array size"
      options={options}
      value={s.size}
      onChange={(size) => size !== s.size && s.setSize(size)}
      columns={options.length > 5 ? 3 : undefined}
    />
  );
};

/** Each input order with what it's for, so the choice explains itself. */
const InputList = () => {
  const s = useSettings();
  return (
    <div role="radiogroup" aria-label="Input" className="flex flex-col gap-1">
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
      label="Display"
      options={[
        { value: "bars", label: <><BarChartIcon /> Bars</> },
        { value: "numbers", label: <><span className="font-mono text-xs">123</span> Numbers</> },
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

/** All settings stacked, for the phone settings sheet. Help is plain text since tooltips don't work on touch. */
export const SettingsPanel = () => {
  const s = useSettings();
  return (
    <div className="flex flex-col gap-6">
      <Field label="Array size" help={sizeHelp(s.isMobile ? NUMBERS_LIMIT.mobile : NUMBERS_LIMIT.desktop)}>
        <SizePicker />
      </Field>
      <Field label="Input">
        <InputList />
      </Field>
      {/* Race lanes always draw bars. */}
      {!s.isRace && (
        <Field label="Display" help={displayHelp}>
          <DisplayPicker />
        </Field>
      )}
    </div>
  );
};

/** A toolbar button that shows the current value and opens its picker. */
const Menu = ({ value, label, children }: { value: ReactNode; label: string; children: ReactNode }) => (
  <Popover.Root>
    <Popover.Trigger
      aria-label={`${label}: change`}
      className="flex h-9 items-center gap-1.5 rounded-sm px-3 text-sm text-foreground transition-colors hover:bg-background/60 data-[state=open]:bg-background/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="text-foreground/60">{label}</span>
      <span className="font-semibold">{value}</span>
      <ChevronDownIcon className="h-4 w-4 text-foreground/60" />
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content
        align="start"
        sideOffset={6}
        className="z-50 flex w-80 flex-col gap-3 rounded-sm border border-line bg-background p-4 text-foreground shadow-xl animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none"
      >
        {children}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
);

/**
 * Desktop: the settings as a toolbar on top of the bars they change, so the
 * sidebar is only for picking algorithms.
 */
export const SettingsToolbar = ({ className }: { className?: string }) => {
  const s = useSettings();
  return (
    <div role="toolbar" aria-label="Settings" className={cn("flex flex-wrap items-center gap-1", className)}>
      <Menu label="Size" value={<span className="font-mono">{s.size}</span>}>
        <SizePicker />
        <p className="text-xs text-foreground/70">{sizeHelp(NUMBERS_LIMIT.desktop)}</p>
      </Menu>
      <Menu label="Input" value={inputOrders[s.inputOrder].label}>
        <InputList />
      </Menu>
      {!s.isRace && (
        <Menu label="Display" value={s.displayMode === "bars" ? "Bars" : "Numbers"}>
          <DisplayPicker />
          <p className="text-xs text-foreground/70">{displayHelp}</p>
        </Menu>
      )}
    </div>
  );
};
