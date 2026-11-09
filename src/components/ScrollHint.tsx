import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import type { Route } from "@/routes";
import { cn } from "@/utils/cn";
import { openFirstDisclosure } from "./ui/open-disclosure";
import { hintLabel, hintOpens } from "./scroll-hint";

/**
 * Under the dock: says there's more to read below the stage, and takes you
 * there. Fades away once the page has been scrolled.
 */
export const ScrollHint = ({ route, className }: { route: Route; className?: string }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <button
      type="button"
      tabIndex={scrolled ? -1 : undefined}
      aria-hidden={scrolled || undefined}
      onClick={() => {
        const about = document.getElementById("about");
        if (!about) return;
        if (hintOpens(route)) openFirstDisclosure(about);
        const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        about.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
      }}
      className={cn(
        "tap-target relative mx-auto flex shrink-0 items-center gap-1.5 rounded-full px-3 text-xs text-foreground/60 transition-[color,opacity] duration-300 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
        scrolled && "pointer-events-none opacity-0",
        className,
      )}
    >
      {hintLabel(route)}
      <ChevronDownIcon aria-hidden className="h-4 w-4 animate-nudge motion-reduce:animate-none" />
    </button>
  );
};
