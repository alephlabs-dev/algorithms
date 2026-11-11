import { CheckIcon } from "@radix-ui/react-icons";
import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";
import { listItemClass } from "./list-row";

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
    className={cn(listItemClass(selected && !checkbox), className)}
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
