import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import { Fragment, useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";
import { Drawer, DrawerSheet, DrawerTrigger } from "./drawer";
import { listItemClass } from "./list-row";
import { popoverClass } from "./popover";
import { SectionLabel } from "./section-label";
import { useSheetPages } from "./sheet-pages";

/** The closed field's look: reads as "tap to change". Also the phone's racers field. */
export const fieldClass =
  "flex h-12 w-full min-w-0 items-center rounded-full border border-edge bg-surface pl-5 pr-10 text-left text-lg font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary";

/** Our chevron at the field's right end; the field needs `relative` around it. */
export const FieldChevron = ({ drillIn }: { drillIn?: boolean }) => {
  // A field that slides its sheet to a list points the way it goes.
  const Icon = drillIn ? ChevronRightIcon : ChevronDownIcon;
  return (
    <Icon
      aria-hidden
      className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/70"
    />
  );
};

export type SelectOption = {
  value: string;
  label: string;
  /** A line under the label saying what the option is for. */
  description?: string;
  /** A picture before the label, e.g. a drawing's thumbnail. */
  icon?: ReactNode;
};

export type SelectGroup = {
  /** A heading over the group's options; without it they follow the previous group. */
  label?: string;
  /** Beside the heading, e.g. how the group's algorithms scale. */
  hint?: string;
  options: SelectOption[];
};

type ListProps = {
  label: string;
  value: string;
  groups: SelectGroup[];
  /** Options side by side, for short ones (drawings); one per row otherwise. */
  columns?: 1 | 2;
  onPick: (value: string) => void;
};

const NEXT = ["ArrowDown", "ArrowRight"];
const PREVIOUS = ["ArrowUp", "ArrowLeft"];

/**
 * The options as a WAI-ARIA listbox: focus starts on the one picked, arrows
 * move it, Home and End jump, Enter or Space picks. Fits without scrolling
 * (UX.md rule 14): a list that doesn't is regrouped, never scrolled.
 */
export const OptionList = ({ label, value, groups, columns = 1, onPick }: ListProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus({ preventScroll: true });
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const options = [...(ref.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const at = options.indexOf(document.activeElement as HTMLElement);
    const last = options.length - 1;
    let to: number | null = null;
    if (NEXT.includes(event.key)) to = Math.min(at + 1, last);
    else if (PREVIOUS.includes(event.key)) to = Math.max(at - 1, 0);
    else if (event.key === "Home") to = 0;
    else if (event.key === "End") to = last;
    else if ((event.key === "Enter" || event.key === " ") && at >= 0) {
      event.preventDefault();
      onPick(options[at].dataset.value!);
      return;
    }
    if (to === null) return;
    event.preventDefault();
    options[to]?.focus();
  };

  const option = (o: SelectOption) => {
    const selected = o.value === value;
    return (
      <div
        key={o.value}
        role="option"
        aria-selected={selected}
        tabIndex={selected ? 0 : -1}
        data-value={o.value}
        onClick={() => onPick(o.value)}
        className={cn(listItemClass(selected), "cursor-pointer pointer-coarse:min-h-11", o.description && "py-2")}
      >
        {o.icon}
        {o.description ? (
          <span className="flex flex-col gap-0.5">
            <span className="font-semibold">{o.label}</span>
            <span className="text-xs font-normal text-foreground/70">{o.description}</span>
          </span>
        ) : (
          <span className="leading-tight">{o.label}</span>
        )}
      </div>
    );
  };
  const grid = cn("grid gap-1", columns === 2 && "grid-cols-2");

  return (
    <div ref={ref} role="listbox" aria-label={label} onKeyDown={onKeyDown} className="flex flex-col gap-4">
      {groups.map((group, k) =>
        group.label ? (
          <div key={group.label} role="group" aria-labelledby={`${id}-${k}`} className="flex flex-col gap-1">
            <SectionLabel id={`${id}-${k}`} className="flex justify-between gap-3 px-3">
              {group.label}
              {group.hint && <span className="font-mono normal-case tracking-normal">{group.hint}</span>}
            </SectionLabel>
            <div className={grid}>{group.options.map(option)}</div>
          </div>
        ) : (
          <div key={k} className={grid}>
            {group.options.map(option)}
          </div>
        ),
      )}
    </div>
  );
};

type Props = {
  /** The setting's name: the list's name, and the title over it on phones. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  groups: SelectGroup[];
  columns?: 1 | 2;
  className?: string;
  "data-tour"?: string;
};

/** The closed field: the value picked, and a chevron. Named "Label: value". */
const Field = ({
  label,
  current,
  drillIn,
  className,
  ...props
}: { label: string; current: string; drillIn?: boolean } & ComponentProps<"button">) => (
  <button type="button" aria-label={`${label}: ${current}`} {...props} className={cn(fieldClass, "relative", className)}>
    <span className="truncate">{current}</span>
    <FieldChevron drillIn={drillIn} />
  </button>
);

/**
 * Our own select (UX.md rule 11), never the OS list. Beside the stage (iPad
 * landscape, desktop) it opens a popover; on phones and iPad portrait a
 * drawer, or, inside a sheet already, the sheet slides to the list in place.
 */
export const Select = ({ label, value, onChange, groups, columns, className, "data-tour": tour }: Props) => {
  const pages = useSheetPages();
  const wide = useMediaQuery("(min-width: 1024px)");
  const [open, setOpen] = useState(false);
  const id = useId();
  const current = groups.flatMap((g) => g.options).find((o) => o.value === value)?.label ?? value;
  const list = (onPick: (value: string) => void) => (
    <OptionList label={label} value={value} groups={groups} columns={columns} onPick={onPick} />
  );
  /** Picking applies the option, then the list goes away. */
  const pickThen = (leave: () => void) => (picked: string) => {
    if (picked !== value) onChange(picked);
    leave();
  };

  if (pages) {
    const page = pages.page?.id === id ? pages.page : null;
    return (
      <>
        <Field
          label={label}
          current={current}
          drillIn
          data-tour={tour}
          className={className}
          onClick={(event) => pages.open(id, label, event.currentTarget)}
        />
        {/* A new list each visit, so focus starts on the option picked every time. */}
        {page && pages.slot && createPortal(<Fragment key={page.visit}>{list(pickThen(pages.back))}</Fragment>, pages.slot)}
      </>
    );
  }

  const field = (
    <Field label={label} current={current} aria-haspopup="listbox" aria-expanded={open} data-tour={tour} className={className} />
  );
  const close = () => setOpen(false);

  if (wide) {
    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>{field}</Popover.Trigger>
        <Popover.Portal>
          {/* Beside the stage the field sits in the side panel: the list opens to its left, where it has the full height. */}
          <Popover.Content
            side="left"
            align="start"
            sideOffset={8}
            collisionPadding={16}
            className={cn(popoverClass, "w-max min-w-(--radix-popover-trigger-width) max-w-sm")}
          >
            {list(pickThen(close))}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{field}</DrawerTrigger>
      <DrawerSheet title={label}>{list(pickThen(close))}</DrawerSheet>
    </Drawer>
  );
};
