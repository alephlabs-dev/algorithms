import type { ReactNode } from "react";

// Each module's settings (its Settings.tsx) stack Fields for the settings sheet and panel. Where the panel
// replaces a module's tools row (iPad landscape and desktop), the same controls carry
// its "tools" tour anchor. Help is plain text since tooltips don't work on touch.

/** One setting with its name above and help below. `tour` lets a tour step point at it. */
export const Field = ({
  label,
  help,
  tour,
  children,
}: {
  label: string;
  help?: string;
  tour?: string;
  children: ReactNode;
}) => (
  <div data-tour={tour} className="flex flex-col gap-2">
    <h3 className="text-sm font-semibold text-foreground">{label}</h3>
    {children}
    {help && <p className="text-xs text-foreground/70">{help}</p>}
  </div>
);
