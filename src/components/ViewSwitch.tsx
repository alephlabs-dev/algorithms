import { useShallow } from "zustand/react/shallow";
import { useStore, type View } from "@/store";
import { SegmentedControl } from "./ui/segmented";
import { localized } from "@/i18n";

const text = localized({
  en: { view: "View", visualize: "Visualize", race: "Race" },
  es: { view: "Vista", visualize: "Solo", race: "Carrera" },
});

export const ViewSwitch = ({ className }: { className?: string }) => {
  const { view, setView } = useStore(
    useShallow((s) => ({ view: s.view, setView: s.setView })),
  );
  return (
    <div data-tour="race" className={className}>
      <SegmentedControl<View>
        label={text.view}
        options={[
          { value: "single", label: text.visualize },
          { value: "race", label: text.race },
        ]}
        value={view}
        onChange={(next) => next !== view && setView(next)}
        compact
      />
    </div>
  );
};
