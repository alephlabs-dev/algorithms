import { useShallow } from "zustand/react/shallow";
import { useStore, type View } from "@/store";
import { SegmentedControl } from "./ui/segmented";

export const ViewSwitch = ({ className }: { className?: string }) => {
  const { view, setView, isPlaying } = useStore(
    useShallow((s) => ({ view: s.view, setView: s.setView, isPlaying: s.isPlaying }))
  );
  return (
    <SegmentedControl<View>
      label="View"
      options={[
        { value: "single", label: "Visualize" },
        { value: "race", label: "Race" },
      ]}
      value={view}
      onChange={(next) => next !== view && setView(next)}
      disabled={isPlaying}
      compact
      className={className}
    />
  );
};
