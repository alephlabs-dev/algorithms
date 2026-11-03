import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

const Badge = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn(
      "inline-flex items-center rounded-sm bg-foreground px-2.5 py-0.5 text-xs font-semibold text-background shadow-sm",
      className
    )}
    {...props}
  />
);

export { Badge };
