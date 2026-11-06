import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

/**
 * A collapsible section of explanatory text (UX.md rule 9): a heading whose
 * button shows and hides the panel below it. Closed on entry. The panel stays
 * in the HTML while closed, so prerendered pages keep their text for search
 * engines.
 */
export const Disclosure = ({
  title,
  children,
  className,
  headingClassName = "text-xl font-semibold",
  panelClassName,
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  /** The heading's type: a page section's by default, smaller inside a card. */
  headingClassName?: string;
  panelClassName?: string;
}) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <h2 className={headingClassName}>
        <button
          type="button"
          data-disclosure
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((was) => !was)}
          className="tap-target relative -mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-4 rounded-xl px-2 py-1 text-left hover:text-foreground/80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
        >
          {title}
          <ChevronDownIcon
            aria-hidden
            className={cn("h-5 w-5 shrink-0 text-foreground/60 transition-transform motion-reduce:transition-none", open && "rotate-180")}
          />
        </button>
      </h2>
      <div id={panelId} hidden={!open} className={cn("flex flex-col gap-4", panelClassName)}>
        {children}
      </div>
    </section>
  );
};
