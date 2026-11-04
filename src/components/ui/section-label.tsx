import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

/** Small uppercase label that names a group of controls. */
export const SectionLabel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <h2 className={cn("text-xs font-semibold uppercase tracking-wider text-foreground/60", className)}>
    {children}
  </h2>
);
