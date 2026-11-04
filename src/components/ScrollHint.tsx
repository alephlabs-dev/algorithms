import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { graphAlgorithms } from "@/consts/graphAlgorithms";
import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import type { Route } from "@/routes";
import { cn } from "@/utils/cn";

const labelFor = (route: Route) => {
  switch (route.kind) {
    case "home":
    case "sorting":
      return "About sorting algorithms";
    case "pathfinding":
      return "About pathfinding algorithms";
    case "graphs":
      return "About graph algorithms";
    case "graph":
      return `How ${graphAlgorithms[route.algorithm].title} works`;
    case "race":
    case "pathRace":
    case "graphRace":
      return "How the race works";
    case "path":
      return `How ${pathAlgorithms[route.algorithm].title} works`;
    case "algorithm":
      return `How ${sortingAlgorithms[route.algorithm].title} works`;
  }
};

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
        const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById("about")?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
      }}
      className={cn(
        "mx-auto flex shrink-0 items-center gap-1.5 rounded-full px-3 text-xs text-foreground/60 transition-[color,opacity] duration-300 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
        scrolled && "pointer-events-none opacity-0",
        className,
      )}
    >
      {labelFor(route)}
      <ChevronDownIcon aria-hidden className="h-4 w-4 animate-nudge motion-reduce:animate-none" />
    </button>
  );
};
