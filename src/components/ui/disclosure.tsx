import { ChevronDownIcon } from "@radix-ui/react-icons";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

/**
 * A collapsible section of explanatory text (UX.md rule 9): a native
 * `<details>` whose `<summary>` holds the heading. Closed on entry. The browser
 * opens and closes it, not React, so a tap works on the prerendered page
 * before the app's JavaScript has loaded, and stays open once it has (#140).
 * The panel stays in the HTML while closed, so prerendered pages keep their
 * text for search engines.
 */
export const Disclosure = ({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) => (
  <details data-disclosure className={cn("group", className)}>
    <summary className="tap-target relative -mx-2 flex w-[calc(100%+1rem)] cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-2 py-1 text-left hover:text-foreground/80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
      <h2 className="text-xl font-semibold">{title}</h2>
      <ChevronDownIcon
        aria-hidden
        className="h-5 w-5 shrink-0 text-foreground/60 transition-transform group-open:rotate-180 motion-reduce:transition-none"
      />
    </summary>
    <div className="mt-4 flex flex-col gap-4">{children}</div>
  </details>
);
