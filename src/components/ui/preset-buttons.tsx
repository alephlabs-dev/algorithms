import { UpdateIcon } from "@radix-ui/react-icons";
import { cn } from "@/utils/cn";

type Preset<T extends string> = { value: T; label: string; title: string };

/**
 * Ready-made layouts as a row of outlined buttons. The current kind is marked,
 * with ↻ since pressing it again makes another one of the same kind.
 */
export const PresetButtons = <T extends string>({
  presets,
  current,
  onPick,
  label = "Layouts",
  className,
}: {
  presets: Preset<T>[];
  current: T;
  onPick: (value: T) => void;
  label?: string;
  className?: string;
}) => (
  <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
    {presets.map((p) => {
      const isCurrent = p.value === current;
      return (
        <button
          key={p.value}
          type="button"
          title={isCurrent ? `${p.title} (another one)` : p.title}
          aria-pressed={isCurrent}
          onClick={() => onPick(p.value)}
          className={cn(
            "flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
            isCurrent
              ? "border-foreground/60 bg-accent font-semibold text-foreground"
              : "border-line/70 text-foreground/85 hover:bg-accent hover:text-foreground",
          )}
        >
          {p.label}
          {isCurrent && <UpdateIcon aria-hidden className="h-3.5 w-3.5 text-foreground/70" />}
        </button>
      );
    })}
  </div>
);
