import { useShallow } from "zustand/react/shallow";
import { useStore, type View } from "@/store";
import { cn } from "@/utils/cn";
import { useGuessIsNew, useViews } from "./views";
import { SegmentedControl, type SegmentedOption } from "./ui/segmented";
import { localized } from "@/i18n";

const text = localized({
  en: { view: "View", visualize: "Visualize", race: "Race", guess: "Guess", newGuess: "Guess, new" },
  es: { view: "Vista", visualize: "Solo", race: "Carrera", guess: "Adivina", newGuess: "Adivina, nuevo" },
});

/**
 * Visualize / Race / Guess, as far as the module has them. Its labels never shrink or
 * get cut: it is as wide as they are, and what sits beside it gives way.
 */
export const ViewSwitch = ({ className }: { className?: string }) => {
  const { view, setView } = useStore(useShallow((s) => ({ view: s.view, setView: s.setView })));
  const views = useViews();
  const isNew = useGuessIsNew();
  const labels: Record<View, string> = { single: text.visualize, race: text.race, guess: text.guess };
  const options = views.map((value): SegmentedOption<View> => {
    if (value !== "guess") return { value, label: labels[value] };
    return {
      value,
      "data-tour": "game",
      ...(isNew && { title: text.newGuess }),
      label: (
        <>
          {text.guess}
          {isNew && (
            <span aria-hidden className="absolute right-1 top-1 h-2 w-2 rounded-full bg-secondary ring-2 ring-background" />
          )}
        </>
      ),
    };
  });
  return (
    <div data-tour="race" className={cn("shrink-0", className)}>
      <SegmentedControl<View>
        label={text.view}
        options={options}
        value={view}
        onChange={(next) => next !== view && setView(next)}
        compact
        fit
      />
    </div>
  );
};
