import { useShallow } from "zustand/react/shallow";
import { structurePresetOptions, structures, structureSizeLabels } from "./algorithms";
import type { StructureSize } from "./presets";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { FactLine } from "@/components/ui/fact-line";
import { PresetButtons } from "@/components/ui/preset-buttons";
import { SegmentedControl } from "@/components/ui/segmented";
import { localized } from "@/i18n";

const text = localized({
  en: {
    starting: "Starting values",
    howMany: "How many values",
    values: (n: string) => `${n} values`,
    legend: "Legend",
    comparing: "Comparing",
    placedOrSwapped: "Placed or swapped",
    takenOut: "Taken out",
    checkingSlot: "Checking a slot",
    bucket: "The bucket",
    slotsWalked: "Slots walked",
    placedOrFound: "Placed or found",
    deleted: "Deleted (marker)",
    onTheWay: "On the way down",
    rotated: "Placed, found or rotated",
    balance: "Balance (left − right height)",
    height: (h: number) => `height ${h}`,
    load: (l: string) => `load ${l}`,
    count: (n: number) => count(n, "value"),
  },
  es: {
    starting: "Valores iniciales",
    howMany: "Cuántos valores",
    values: (n) => `${n} valores`,
    legend: "Leyenda",
    comparing: "Comparando",
    placedOrSwapped: "Ubicado o intercambiado",
    takenOut: "Sacado",
    checkingSlot: "Revisando una casilla",
    bucket: "La cubeta",
    slotsWalked: "Casillas recorridas",
    placedOrFound: "Ubicado o encontrado",
    deleted: "Borrado (marca)",
    onTheWay: "En el camino de bajada",
    rotated: "Ubicado, encontrado o rotado",
    balance: "Balance (altura izq. − der.)",
    height: (h) => `altura ${h}`,
    load: (l) => `carga ${l}`,
    count: (n) => `${n} ${n === 1 ? "valor" : "valores"}`,
  },
});


/** Which values the tree starts from, in which order. */
export const StructurePresetButtons = ({ className }: { className?: string }) => {
  const { preset, apply } = useStore(useShallow((s) => ({ preset: s.structures.preset, apply: s.actions.structures.applyPreset })));
  return (
    <PresetButtons
      label={text.starting}
      presets={structurePresetOptions}
      current={preset}
      onPick={apply}
      className={className}
    />
  );
};

export const StructureSizePicker = () => {
  const { size, setSize } = useStore(useShallow((s) => ({ size: s.structures.size, setSize: s.actions.structures.setSize })));
  return (
    <SegmentedControl<StructureSize>
      label={text.howMany}
      options={(Object.keys(structureSizeLabels) as StructureSize[]).map((value) => ({
        value,
        label: <span className="font-mono">{structureSizeLabels[value]}</span>,
        title: text.values(structureSizeLabels[value]),
      }))}
      value={size}
      onChange={(value) => value !== size && setSize(value)}
    />
  );
};

/** Above the stage: how the tree starts out. */
export const StructureTools = ({ className }: { className?: string }) => (
  <div
    data-tour="tools"
    role="toolbar"
    aria-label={text.starting}
    className={cn("flex flex-wrap items-center gap-2 self-start", className)}
  >
    <StructurePresetButtons />
  </div>
);

const Item = ({ className, label }: { className: string; label: string }) => (
  <li className="flex items-center gap-2">
    <span aria-hidden className={cn("h-2.5 w-2.5 shrink-0 rounded-full", className)} />
    {label}
  </li>
);

/** What the colors and badges mean. */
export const StructureLegend = ({ className }: { className?: string }) => {
  const algorithm = useStore((s) => s.structures.algorithm);
  const avl = algorithm === "avl";
  const list = cn(
    "flex text-xs text-foreground md:text-sm",
    "flex-wrap items-center gap-x-4 gap-y-1",
    className,
  );
  if (algorithm === "heap")
    return (
      <ul aria-label={text.legend} className={list}>
        <Item className="bg-secondary" label={text.comparing} />
        <Item className="bg-primary" label={text.placedOrSwapped} />
        <Item className="bg-tertiary" label={text.takenOut} />
      </ul>
    );
  if (algorithm === "chaining" || algorithm === "probing")
    return (
      <ul aria-label={text.legend} className={list}>
        <Item className="bg-secondary" label={algorithm === "chaining" ? text.comparing : text.checkingSlot} />
        <Item className="bg-secondary/45" label={algorithm === "chaining" ? text.bucket : text.slotsWalked} />
        <Item className="bg-primary" label={text.placedOrFound} />
        {algorithm === "probing" && (
          <li className="flex items-center gap-2">
            <span aria-hidden className="font-mono text-foreground/60">
              ×
            </span>
            {text.deleted}
          </li>
        )}
      </ul>
    );
  return (
    <ul
      aria-label={text.legend}
      className={cn(
        "flex text-xs text-foreground md:text-sm",
        "flex-wrap items-center gap-x-4 gap-y-1",
        className,
      )}
    >
      <Item className="bg-secondary" label={text.comparing} />
      <Item className="bg-secondary/45" label={text.onTheWay} />
      <Item className="bg-primary" label={avl ? text.rotated : text.placedOrFound} />
      {avl && (
        <li className="flex items-center gap-2">
          <span
            aria-hidden
            className="rounded-full bg-foreground px-1.5 font-mono text-[10px] font-semibold text-background"
          >
            +1
          </span>
          {text.balance}
        </li>
      )}
    </ul>
  );
};

/** Size and height, for the dock: what balancing is about. */
export const StructureStatsInline = ({ className }: { className?: string }) => {
  const { size, detail } = useStore(
    useShallow((s) => {
      const frame = s.structures.run.frames[Math.min(s.frameIndex, s.structures.run.frames.length - 1)];
      if (frame.shape === "tree") return { size: frame.nodes.length, detail: text.height(Math.max(0, frame.height)) };
      // A table's speed is about how full it is.
      return { size: frame.count, detail: text.load((frame.count / frame.buckets.length).toFixed(2)) };
    }),
  );
  return (
    <p className={cn("whitespace-nowrap font-mono text-xs text-foreground/80", className)}>
      {text.count(size)} · {detail}
    </p>
  );
};

export const StructureFacts = () => {
  const algorithm = useStore((s) => s.structures.algorithm);
  const { cost, shape } = structures[algorithm];
  return <FactLine facts={[cost, shape]} />;
};
