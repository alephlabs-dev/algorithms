import { useShallow } from "zustand/react/shallow";
import { useStore, type View } from "@/store";
import { SegmentedControl } from "./ui/segmented";

export const ViewSwitch = ({ className }: { className?: string }) => {
  const { view, setView } = useStore(
    useShallow((s) => ({ view: s.view, setView: s.setView })),
  );
  return (
    <div data-tour="race" className={className}>
      <SegmentedControl<View>
        label="View"
        options={[
          { value: "single", label: "Visualize" },
          { value: "race", label: "Race" },
        ]}
        value={view}
        onChange={(next) => next !== view && setView(next)}
        compact
      />
    </div>
  );
};
