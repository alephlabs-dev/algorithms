import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { BarsRenderer } from "@/canvas/barsRenderer";
import { useElementSize } from "@/hooks/useElementSize";
import { selectFrame, selectLastIndex, useStore } from "@/store";
import { moveDuration } from "@/utils/speed";
import { PseudocodeCaption } from "../Pseudocode";

export const AlgorithmVisualizer = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BarsRenderer | null>(null);
  const { width, height } = useElementSize(wrapperRef);

  const { frame, values, frameIndex, lastIndex, arrayId, displayMode, speed } = useStore(
    useShallow((s) => ({
      frame: selectFrame(s),
      values: s.timeline.values,
      frameIndex: s.frameIndex,
      lastIndex: selectLastIndex(s),
      arrayId: s.arrayId,
      displayMode: s.displayMode,
      speed: s.speed,
    }))
  );

  useEffect(() => {
    const renderer = new BarsRenderer(canvasRef.current!);
    rendererRef.current = renderer;
    return () => renderer.destroy();
  }, []);

  useEffect(() => {
    rendererRef.current?.resize(width, height, window.devicePixelRatio || 1);
  }, [width, height]);

  useEffect(() => {
    rendererRef.current?.update({
      frame,
      values,
      mode: displayMode,
      moveDuration: moveDuration(speed),
      celebrate: frameIndex > 0 && frameIndex === lastIndex,
      runId: arrayId,
    });
  }, [frame, values, displayMode, speed, frameIndex, lastIndex, arrayId]);

  // The canvas is a picture to screen readers, so describe the current step in words.
  const describe = () => {
    if (frameIndex === lastIndex && frameIndex > 0) return "The array is sorted.";
    if (frame.active.length === 2) {
      const [a, b] = frame.active.map((id) => values[id]);
      return `Comparing ${a} and ${b}.`;
    }
    return "";
  };

  return (
    <div className="flex flex-col gap-1 border border-accent/50 lg:border-none lg:bg-accent rounded-sm overflow-hidden h-full min-w-0 p-1 md:p-2 lg:p-3 xl:p-8">
      {/* On wide screens the full pseudocode sits beside the bars instead. */}
      <PseudocodeCaption className="xl:hidden" />
      <div ref={wrapperRef} className="relative w-full flex-1 min-h-0">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Array of ${values.length} items, step ${frameIndex} of ${lastIndex}. ${describe()}`}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
};
