import type { MouseEvent, ReactNode } from "react";
import { flushSync } from "react-dom";
import { href, type Route } from "@/routes";

/**
 * A link to one of the site's pages. In the app it switches pages without
 * reloading (through `onNavigate`); in prerendered HTML it's a plain link.
 */
export const PageLink = ({
  to,
  search = "",
  onNavigate,
  children,
  className = "font-semibold underline decoration-line underline-offset-4 hover:decoration-foreground",
  ...rest
}: {
  to: Route;
  /** The query string the page opens with (its settings), when it isn't the page's defaults. */
  search?: string;
  onNavigate?: (route: Route) => void;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) => (
  <a
    href={href(to) + search}
    className={className}
    {...rest}
    onClick={(event: MouseEvent) => {
      // Let modified clicks open a new tab as usual.
      if (!onNavigate || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      // Draw the new page first: WebKit stops a smooth scroll when the page changes under it.
      flushSync(() => onNavigate(to));
      // No explicit behavior: it follows the theme's scroll-behavior, which glides
      // only when the learner hasn't asked for reduced motion.
      window.scrollTo({ top: 0 });
    }}
  >
    {children}
  </a>
);
