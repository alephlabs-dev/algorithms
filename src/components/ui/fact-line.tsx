import { Fragment } from "react";
import { cn } from "@/utils/cn";

/** Short facts in a mono line, "Queue · ignores weights · O(V + E)", that wraps between facts, never inside one. */
export const FactLine = ({ facts, className }: { facts: string[]; className?: string }) => (
  <p className={cn("flex flex-wrap gap-x-1.5 font-mono text-xs text-foreground/70", className)}>
    {facts.map((fact, k) => (
      <Fragment key={fact}>
        {k > 0 && <span aria-hidden>·</span>}
        <span className="whitespace-nowrap">{fact}</span>
      </Fragment>
    ))}
  </p>
);
