import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectFrame, selectGameQuestion, selectGuessPlaying, selectLastIndex, useStore } from "@/store";
import { ArrayCanvas } from "./ArrayCanvas";
import { FinishSummary } from "./FinishSummary";

export const AlgorithmVisualizer = () => {
  const { frame, values, frameIndex, lastIndex, arrayId, displayMode, labels, labelAll } = useStore(
    useShallow((s) => ({
      frame: selectFrame(s),
      values: s.timeline.values,
      frameIndex: s.frameIndex,
      lastIndex: selectLastIndex(s),
      arrayId: s.arrayId,
      displayMode: s.displayMode,
      labels: selectGameQuestion(s)?.labels,
      labelAll: selectGuessPlaying(s),
    }))
  );
  const finished = frameIndex > 0 && frameIndex === lastIndex;
  // While a question waits, only its bars are lit: the pair compared just before would point elsewhere.
  const shown = useMemo(() => (labels ? { ...frame, active: [...labels] } : frame), [frame, labels]);

  // The canvas is a picture to screen readers, so describe the current step in words.
  const describe = () => {
    if (finished) return "The array is sorted.";
    if (shown.active.length === 2) {
      const [a, b] = shown.active.map((id) => values[id]);
      return `Comparing ${a} and ${b}.`;
    }
    return "";
  };
  // Guess mode shows every value on the bars; say them too, so a question can be answered by ear.
  const valuesInOrder = labelAll ? ` Values left to right: ${frame.order.map((id) => values[id]).join(", ")}.` : "";

  // Full bleed: the bars sit on the page itself, with no panel around them.
  return (
    <div data-tour="bars" className="relative flex h-full min-h-0 min-w-0 flex-col">
      <ArrayCanvas
        frame={shown}
        values={values}
        mode={displayMode}
        celebrate={finished}
        runId={arrayId}
        annotate
        labels={labels}
        labelAll={labelAll}
        label={`Array of ${values.length} items, step ${frameIndex} of ${lastIndex}. ${describe()}${valuesInOrder}`}
      />
      {/* In the empty band above the tallest bars (they reach 80% of the height). */}
      <FinishSummary className="absolute inset-x-2 top-2 flex justify-center" />
    </div>
  );
};
