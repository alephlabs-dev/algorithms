import { ChevronDownIcon } from "@radix-ui/react-icons";
import { Fragment } from "react";
import { cn } from "@/utils/cn";

/** The closed field's look: reads as "tap to change". Also the phone's racers field. */
export const fieldClass =
  "flex h-12 w-full min-w-0 items-center rounded-full border border-edge bg-surface pl-5 pr-10 text-left text-lg font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary";

/** Our chevron at the field's right end; the field needs `relative` around it. */
export const FieldChevron = () => (
  <ChevronDownIcon
    aria-hidden
    className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/70"
  />
);

export type NativeSelectGroup = {
  /** Shown as an <optgroup>; without it the options sit at the top level. */
  label?: string;
  /** `short`: a shorter name, kept on the option as data-short (e2e measures whether shorts would fit as segments). */
  options: { value: string; label: string; short?: string }[];
};

type Props = {
  /** Accessible name of the select. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  groups: NativeSelectGroup[];
  className?: string;
  "data-tour"?: string;
};

/**
 * A closed trigger in our own look (UX.md rule 11) over a native <select>, so
 * phones open their own picker (the iOS wheel, the Android list): no browser
 * arrow (appearance: none), theme colors, our chevron.
 */
export const NativeSelect = ({ label, value, onChange, groups, className, "data-tour": tour }: Props) => (
  <div data-tour={tour} className={cn("relative min-w-0", className)}>
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(fieldClass, "appearance-none truncate")}
    >
      {groups.map((group, index) => {
        const options = group.options.map((option) => (
          <option key={option.value} value={option.value} data-short={option.short}>
            {option.label}
          </option>
        ));
        return group.label ? (
          <optgroup key={group.label} label={group.label}>
            {options}
          </optgroup>
        ) : (
          <Fragment key={index}>{options}</Fragment>
        );
      })}
    </select>
    <FieldChevron />
  </div>
);
