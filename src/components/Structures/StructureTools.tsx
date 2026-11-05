import { useShallow } from "zustand/react/shallow";
import { structurePresetOptions, structures, structureSizeLabels } from "@/consts/structures";
import type { StructureSize } from "@/structures";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { FactLine } from "../ui/fact-line";
import { PresetButtons } from "../ui/preset-buttons";
import { SegmentedControl } from "../ui/segmented";

/** Which values the tree starts from, in which order. */
export const StructurePresetButtons = ({ className }: { className?: string }) => {
  const { preset, apply } = useStore(useShallow((s) => ({ preset: s.structurePreset, apply: s.applyStructurePreset })));
  return (
    <PresetButtons
      label="Starting values"
      presets={structurePresetOptions}
      current={preset}
      onPick={apply}
      className={className}
    />
  );
};

export const StructureSizePicker = () => {
  const { size, setSize } = useStore(useShallow((s) => ({ size: s.structureSize, setSize: s.setStructureSize })));
  return (
    <SegmentedControl<StructureSize>
      label="How many values"
      options={(Object.keys(structureSizeLabels) as StructureSize[]).map((value) => ({
        value,
        label: <span className="font-mono">{structureSizeLabels[value]}</span>,
        title: `${structureSizeLabels[value]} values`,
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
    aria-label="Starting values"
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
export const StructureLegend = ({ className, stacked }: { className?: string; stacked?: boolean }) => {
  const algorithm = useStore((s) => s.structureAlgorithm);
  const avl = algorithm === "avl";
  const list = cn(
    "flex text-xs text-foreground md:text-sm",
    stacked ? "flex-col gap-1.5" : "flex-wrap items-center gap-x-4 gap-y-1",
    className,
  );
  if (algorithm === "heap")
    return (
      <ul aria-label="Legend" className={list}>
        <Item className="bg-secondary" label="Comparing" />
        <Item className="bg-primary" label="Placed or swapped" />
        <Item className="bg-tertiary" label="Taken out" />
      </ul>
    );
  if (algorithm === "chaining" || algorithm === "probing")
    return (
      <ul aria-label="Legend" className={list}>
        <Item className="bg-secondary" label={algorithm === "chaining" ? "Comparing" : "Checking a slot"} />
        <Item className="bg-secondary/45" label={algorithm === "chaining" ? "The bucket" : "Slots walked"} />
        <Item className="bg-primary" label="Placed or found" />
        {algorithm === "probing" && (
          <li className="flex items-center gap-2">
            <span aria-hidden className="font-mono text-foreground/60">
              ×
            </span>
            Deleted (marker)
          </li>
        )}
      </ul>
    );
  return (
    <ul
      aria-label="Legend"
      className={cn(
        "flex text-xs text-foreground md:text-sm",
        stacked ? "flex-col gap-1.5" : "flex-wrap items-center gap-x-4 gap-y-1",
        className,
      )}
    >
      <Item className="bg-secondary" label="Comparing" />
      <Item className="bg-secondary/45" label="On the way down" />
      <Item className="bg-primary" label={avl ? "Placed, found or rotated" : "Placed or found"} />
      {avl && (
        <li className="flex items-center gap-2">
          <span
            aria-hidden
            className="rounded-full bg-foreground px-1.5 font-mono text-[10px] font-semibold text-background"
          >
            +1
          </span>
          Balance (left − right height)
        </li>
      )}
    </ul>
  );
};

/** Size and height, for the dock: what balancing is about. */
export const StructureStatsInline = ({ className }: { className?: string }) => {
  const { size, detail } = useStore(
    useShallow((s) => {
      const frame = s.structureRun.frames[Math.min(s.frameIndex, s.structureRun.frames.length - 1)];
      if (frame.shape === "tree") return { size: frame.nodes.length, detail: `height ${Math.max(0, frame.height)}` };
      // A table's speed is about how full it is.
      return { size: frame.count, detail: `load ${(frame.count / frame.buckets.length).toFixed(2)}` };
    }),
  );
  return (
    <p className={cn("whitespace-nowrap font-mono text-xs text-foreground/80", className)}>
      {count(size, "value")} · {detail}
    </p>
  );
};

export const StructureFacts = () => {
  const algorithm = useStore((s) => s.structureAlgorithm);
  const { cost, shape } = structures[algorithm];
  return <FactLine facts={[cost, shape]} />;
};
