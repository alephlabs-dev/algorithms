import { useShallow } from "zustand/react/shallow";
import { selectFrame, selectLastIndex, useStore } from "@/store";
import { PseudocodeCaption } from "../Pseudocode";
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
    <div className="relative flex flex-col gap-1 border border-accent/50 lg:border-none lg:bg-accent rounded-sm overflow-hidden h-full min-w-0 p-1 md:p-2 lg:p-3 xl:p-8">
      {/* On wide screens the full pseudocode sits beside the bars instead. */}
      <PseudocodeCaption className="xl:hidden" />
      <ArrayCanvas
        frame={frame}
        values={values}
        mode={displayMode}
        celebrate={finished}
        runId={arrayId}
        label={`Array of ${values.length} items, step ${frameIndex} of ${lastIndex}. ${describe()}`}
      />
      {/* Sits in the empty band above the bars (below the caption on narrow screens). */}
      <FinishSummary className="absolute inset-x-2 top-11 flex justify-center xl:top-4" />
    </div>
  );
};
