import { useShallow } from "zustand/react/shallow";
import { selectFrame, selectLastIndex, useStore } from "@/store";
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

  // Full bleed: the bars sit on the page itself, with no panel around them.
  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col">
      <ArrayCanvas
        frame={frame}
        values={values}
        mode={displayMode}
        celebrate={finished}
        runId={arrayId}
        annotate
        label={`Array of ${values.length} items, step ${frameIndex} of ${lastIndex}. ${describe()}`}
      />
      {/* In the empty band above the tallest bars (they reach 80% of the height). */}
      <FinishSummary className="absolute inset-x-2 top-2 flex justify-center" />
    </div>
  );
};
