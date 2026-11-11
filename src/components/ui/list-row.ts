import { cn } from "@/utils/cn";

/** A row's look; a picked row (single-select) is filled, with a bar on its left edge. Also the select's options. */
export const listItemClass = (selected: boolean) =>
  cn(
    "relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary lg:min-h-9",
    selected &&
      "bg-accent font-semibold before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-foreground"
  );
