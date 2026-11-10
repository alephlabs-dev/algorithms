import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { GridRenderer } from "@/canvas/gridRenderer";
import { mazeGridCells, mazePalette } from "@/canvas/mazePaint";
import { mazeAlgorithms } from "@/consts/mazeAlgorithms";
import { useElementSize } from "@/hooks/useElementSize";
import { localized } from "@/i18n";
import { selectSpeed } from "@/modules/engine";
import { useStore } from "@/store";
import { describeMazeFrame } from "@/utils/narrateMaze";
import { moveDuration } from "@/utils/speed";

const text = localized({
  en: { onGrid: (title: string, rows: number, cols: number, frame: string) => `${title} carving a ${rows} by ${cols} grid. ${frame}` },
  es: { onGrid: (title, rows, cols, frame) => `${title} excavando una cuadrícula de ${rows} por ${cols}. ${frame}` },
});

/** The single view: one maze being carved on the shared grid renderer. */
export const MazeStage = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GridRenderer | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const { run, frame, gridId, algorithm, speed, isScrubbing, theme } = useStore(
    useShallow((s) => ({
      run: s.mazes.run,
      frame: s.mazes.run.frameAt(s.frameIndex),
      gridId: s.mazes.inputId,
      algorithm: s.mazes.algorithm,
      speed: selectSpeed(s),
      isScrubbing: s.isScrubbing,
      theme: s.theme,
    })),
  );

  useEffect(() => {
    const renderer = new GridRenderer(canvasRef.current!, mazePalette);
    rendererRef.current = renderer;
    return () => renderer.destroy();
  }, []);

  useEffect(() => {
    rendererRef.current?.resize(width, height, window.devicePixelRatio || 1);
  }, [width, height]);

  useEffect(() => {
    rendererRef.current?.refreshColors();
  }, [theme]);

  useEffect(() => {
    // Colors follow the playback pace, like pathfinding's.
    rendererRef.current?.update({
      ...mazeGridCells(run, frame),
      gridId,
      fade: isScrubbing ? 0 : Math.min(0.25, moveDuration(speed) * 2),
    });
  }, [run, frame, gridId, speed, isScrubbing]);

  return (
    <div data-tour="bars" className="relative flex h-full min-h-0 min-w-0 flex-col">
      <div ref={wrapperRef} className="relative min-h-0 w-full flex-1">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={text.onGrid(mazeAlgorithms[algorithm].title, run.rows, run.cols, describeMazeFrame(frame))}
          className="absolute inset-0 h-full w-full select-none"
        />
      </div>
    </div>
  );
};
