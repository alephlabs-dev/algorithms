import { ChevronDownIcon } from "@radix-ui/react-icons";
import { Fragment } from "react";
import { cn } from "@/utils/cn";

export type NativeSelectGroup = {
  /** Shown as an <optgroup>; without it the options sit at the top level. */
  label?: string;
  options: { value: string; label: string }[];
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
      className="h-12 w-full min-w-0 appearance-none truncate rounded-full border border-edge bg-surface pl-5 pr-10 text-left text-lg font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
    >
      {groups.map((group, k) => {
        const options = group.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ));
        return group.label ? (
          <optgroup key={group.label} label={group.label}>
            {options}
          </optgroup>
        ) : (
          <Fragment key={k}>{options}</Fragment>
        );
      })}
    </select>
    <ChevronDownIcon
      aria-hidden
      className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/70"
    />
  </div>
);
