import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

/** Small uppercase label that names a group of controls. */
export const SectionLabel = ({ children, className, id }: { children: ReactNode; className?: string; id?: string }) => (
  <h2 id={id} className={cn("text-xs font-semibold uppercase tracking-wider text-foreground/60", className)}>
    {children}
  </h2>
);
