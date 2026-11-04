import { useShallow } from "zustand/react/shallow";
import { selectFrame, selectLastIndex, useStore } from "@/store";
import { PseudocodeCaption } from "../Pseudocode";
import { StatsInline } from "../RunInfo";
import { SettingsToolbar } from "../Settings/SettingsPanel";
import { ArrayCanvas } from "./ArrayCanvas";
import { FinishSummary } from "./FinishSummary";

export const AlgorithmVisualizer = () => {
  const { frame, values, frameIndex, lastIndex, arrayId, displayMode } = useStore(
    useShallow((s) => ({
      frame: selectFrame(s),
      values: s.timeline.values,
      frameIndex: s.frameIndex,
      lastIndex: selectLastIndex(s),
      arrayId: s.arrayId,
      displayMode: s.displayMode,
    }))
  );
  const finished = frameIndex > 0 && frameIndex === lastIndex;

  // The canvas is a picture to screen readers, so describe the current step in words.
  const describe = () => {
    if (finished) return "The array is sorted.";
    if (frame.active.length === 2) {
      const [a, b] = frame.active.map((id) => values[id]);
      return `Comparing ${a} and ${b}.`;
    }
    return "";
  };

  return (
    <div className="flex h-full min-w-0 flex-col gap-2 overflow-hidden rounded-sm border border-accent/50 p-1 md:p-2 lg:border-none lg:bg-accent lg:p-4 xl:p-6">
      <div className="flex min-h-8 items-center justify-between gap-2">
        {/* Desktop: settings sit on the bars they change. Narrower: the current code line. */}
        <SettingsToolbar className="-ml-3 hidden lg:flex" />
        <PseudocodeCaption className="flex-1 lg:hidden" />
        {/* On xl these counters live in the card beside the bars. */}
        <StatsInline className="pr-2 xl:hidden" />
      </div>
      <PseudocodeCaption className="hidden lg:flex xl:hidden" />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <ArrayCanvas
          frame={frame}
          values={values}
          mode={displayMode}
          celebrate={finished}
          runId={arrayId}
          label={`Array of ${values.length} items, step ${frameIndex} of ${lastIndex}. ${describe()}`}
        />
        {/* In the empty band above the tallest bars (they reach 80% of the height). */}
        <FinishSummary className="absolute inset-x-2 top-2 flex justify-center" />
      </div>
    </div>
  );
};
