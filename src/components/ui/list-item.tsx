import { CheckIcon } from "@radix-ui/react-icons";
import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

type Props = ComponentProps<"button"> & {
  selected: boolean;
  /** Multi-select lists show a checkbox; single-select lists mark the row instead. */
  checkbox?: boolean;
};

/** One row in a list of choices (algorithms, racers). */
export const ListItem = ({ selected, checkbox, className, children, ...props }: Props) => (
  <button
    type="button"
    aria-pressed={selected}
    className={cn(
      "relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary lg:min-h-9",
      // Single-select: a filled row with a bar on the left edge.
      !checkbox &&
        selected &&
        "bg-accent font-semibold before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-foreground",
      className
    )}
    {...props}
  >
    {checkbox && (
      <span
        aria-hidden
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border-2 border-line",
          selected && "border-foreground bg-foreground text-background"
        )}
      >
        {selected && <CheckIcon className="h-3.5 w-3.5" />}
      </span>
    )}
    {children}
  </button>
);
