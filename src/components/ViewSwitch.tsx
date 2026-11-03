import { useShallow } from "zustand/react/shallow";
import { useStore, type View } from "@/store";
import { cn } from "@/utils/cn";

const views: { view: View; label: string }[] = [
  { view: "single", label: "Visualize" },
  { view: "race", label: "Race" },
];

export const ViewSwitch = ({ className }: { className?: string }) => {
  const { current, setView, isPlaying } = useStore(
    useShallow((s) => ({ current: s.view, setView: s.setView, isPlaying: s.isPlaying }))
  );
  return (
    <div role="tablist" aria-label="View" className={cn("grid grid-cols-2 rounded-sm bg-accent/60 p-1", className)}>
      {views.map(({ view, label }) => (
        <button
          key={view}
          role="tab"
          aria-selected={current === view}
          disabled={isPlaying}
          onClick={() => setView(view)}
          className={cn(
            "h-8 rounded-sm text-sm font-medium transition-colors disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
            current === view ? "bg-primary text-background" : "text-foreground hover:bg-accent"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
