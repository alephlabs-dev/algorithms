import type { MouseEvent, ReactNode } from "react";
import { href, type Route } from "@/routes";

/**
 * A link to one of the site's pages. In the app it switches pages without
 * reloading (through `onNavigate`); in prerendered HTML it's a plain link.
 */
export const PageLink = ({
  to,
  onNavigate,
  children,
  className = "font-semibold underline decoration-line underline-offset-4 hover:decoration-foreground",
  ...rest
}: {
  to: Route;
  onNavigate?: (route: Route) => void;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) => (
  <a
    href={href(to)}
    className={className}
    {...rest}
    onClick={(event: MouseEvent) => {
      // Let modified clicks open a new tab as usual.
      if (!onNavigate || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      onNavigate(to);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }}
  >
    {children}
  </a>
);
