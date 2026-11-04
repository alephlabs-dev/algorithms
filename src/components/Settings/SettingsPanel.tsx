import { BarChartIcon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { inputOrders } from "@/consts/inputOrders";
import { MAX_MOBILE_SIZE, sizes } from "@/consts/sizesMap";
import { useStore } from "@/store";
import type { DisplayMode, InputOrder } from "@/types";
import { cn } from "@/utils/cn";
import { gridSizeLabels, presetLabel } from "@/consts/pathLabels";
import { BrushPicker, GridSizePicker, PresetButtons } from "../Pathfinding/PathTools";
import { ListItem } from "../ui/list-item";
import { popoverClass } from "../ui/popover";
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
      isPath: s.module === "pathfinding",
      gridSize: s.gridSize,
      gridPreset: s.gridPreset,
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

/** All settings stacked, for the settings sheet and menu. Help is plain text since tooltips don't work on touch. */
/** Pathfinding's settings: grid size, brush and layouts. */
const PathSettingsPanel = () => (
  <div className="flex flex-col gap-6">
    <Field label="Grid size" help="A new size starts a fresh layout of the same kind.">
      <GridSizePicker />
    </Field>
    <Field label="Brush" help="Drag on the grid to paint; start on a painted cell to erase. Drag the start or target to move them.">
      <BrushPicker />
    </Field>
    <Field label="Layout">
      <PresetButtons className="-ml-3" />
    </Field>
  </div>
);

export const SettingsPanel = () => {
  const s = useSettings();
  if (s.isPath) return <PathSettingsPanel />;
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

/**
 * Desktop and tablet: one pill in the dock that reads like the settings
 * ("40 · Random") and opens all of them.
 */
export const SettingsMenu = ({ className }: { className?: string }) => {
  const s = useSettings();
  return (
    <Popover.Root>
      <Popover.Trigger
        data-tour="settings"
        aria-label={
          s.isPath
            ? `Settings: ${gridSizeLabels[s.gridSize]} grid, ${presetLabel(s.gridPreset)}. Change`
            : `Settings: ${s.size} items, ${inputOrders[s.inputOrder].label}. Change`
        }
        className={cn(
          "flex h-11 shrink-0 items-center gap-2 rounded-full border border-edge px-4 text-sm text-foreground transition-colors hover:bg-accent data-[state=open]:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
          className
        )}
      >
        <MixerHorizontalIcon className="h-4 w-4 text-foreground/70" />
        <span className={s.isPath ? undefined : "font-mono"}>{s.isPath ? gridSizeLabels[s.gridSize] : s.size}</span>
        <span className="text-foreground/40">·</span>
        <span className="whitespace-nowrap">{s.isPath ? presetLabel(s.gridPreset) : inputOrders[s.inputOrder].label}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="end"
          sideOffset={12}
          className={cn(popoverClass, "max-h-[var(--radix-popover-content-available-height)] w-96 overflow-y-auto p-6")}
        >
          <SettingsPanel />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
