import { useEffect, useRef } from "react";
import type { Frame } from "@/algorithms";
import { BarsRenderer, type DisplayMode } from "@/canvas/barsRenderer";
import { useElementSize } from "@/hooks/useElementSize";
import { useStore } from "@/store";
import { moveDuration } from "@/utils/speed";

type Props = {
  frame: Frame;
  values: readonly number[];
  mode: DisplayMode;
  celebrate: boolean;
  /** Changes when a new array is generated. */
  runId: number;
  label: string;
  /** Callouts on the bars (compared values, pivot). Off for small race lanes. */
  annotate?: boolean;
};

/** A canvas that draws one frame and animates into the next. Fills its parent. */
export const ArrayCanvas = ({ frame, values, mode, celebrate, runId, label, annotate = false }: Props) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BarsRenderer | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const speed = useStore((s) => s.speed);
  const isScrubbing = useStore((s) => s.isScrubbing);

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
      mode,
      moveDuration: isScrubbing ? 0 : moveDuration(speed),
      celebrate,
      runId,
      annotate,
    });
  }, [frame, values, mode, speed, isScrubbing, celebrate, runId, annotate]);

  return (
    <div ref={wrapperRef} className="relative w-full flex-1 min-h-0">
      <canvas ref={canvasRef} role="img" aria-label={label} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
