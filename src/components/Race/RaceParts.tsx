import { BarChartIcon, ResetIcon } from "@radix-ui/react-icons";
import { useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { ordinal } from "@/utils/ordinal";
import { Button } from "../ui/button";
import { localized } from "@/i18n";

const text = localized({
  en: { show: "Show results", label: "Race results", results: "Results", hide: "Hide", again: "Race again" },
  es: { show: "Ver resultados", label: "Resultados de la carrera", results: "Resultados", hide: "Ocultar", again: "Correr de nuevo" },
});

/** A finishing position, with the winner in the accent color. */
export const PlaceBadge = ({ place }: { place: number }) => (
  <span
    className={cn("rounded-full px-2 py-0.5 font-mono text-xs font-semibold", {
      "bg-primary text-background": place === 1,
      "bg-foreground/15": place !== 1,
    })}
  >
    {ordinal(place)}
  </span>
);

/** The podium card over the lanes once everyone has finished. Can be folded to look at the lanes. */
export const ResultsOverlay = ({ children, onReplay }: { children: ReactNode; onReplay: () => void }) => {
  const [folded, setFolded] = useState(false);

  if (folded) {
    return (
      // Floats over the lanes, so it needs a solid fill to read on any of them.
      <Button
        className="absolute bottom-3 right-3 z-10 border-edge bg-surface shadow-[var(--shadow-dock)] animate-in fade-in slide-in-from-bottom-2 duration-200 hover:bg-accent motion-reduce:animate-none"
        onClick={() => setFolded(false)}
      >
        <BarChartIcon /> {text.show}
      </Button>
    );
  }

  return (
    // Over the lanes on wide screens; over the whole screen on phones, where the card is taller than the lanes.
    <div className="fixed inset-0 z-40 grid place-items-center bg-background/60 p-4 backdrop-blur-[2px] animate-in fade-in duration-300 motion-reduce:animate-none md:absolute md:z-10">
      <section
        role="status"
        aria-label={text.label}
        className="flex w-full max-w-md flex-col gap-4 rounded-3xl border border-edge bg-surface p-6 shadow-2xl"
      >
        <h2 className="text-xl font-semibold">{text.results}</h2>
        {children}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setFolded(true)}>
            {text.hide}
          </Button>
          <Button variant="primary" size="sm" onClick={onReplay}>
            <ResetIcon /> {text.again}
          </Button>
        </div>
      </section>
    </div>
  );
};
