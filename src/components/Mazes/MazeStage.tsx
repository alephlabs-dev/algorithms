import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { GridRenderer } from "@/canvas/gridRenderer";
import { mazeGridCells, mazePalette } from "@/canvas/mazePaint";
import { mazeAlgorithms } from "@/consts/mazeAlgorithms";
import { useElementSize } from "@/hooks/useElementSize";
import { localized } from "@/i18n";
import type { MazeFrame, MazeRun } from "@/mazes";
import { selectSpeed } from "@/modules/engine";
import { useStore } from "@/store";
import { describeMazeFrame } from "@/utils/narrateMaze";
import { moveDuration } from "@/utils/speed";

const text = localized({
  en: { onGrid: (title: string, rows: number, cols: number, frame: string) => `${title} carving a ${rows} by ${cols} grid. ${frame}` },
  es: { onGrid: (title, rows, cols, frame) => `${title} excavando una cuadrícula de ${rows} por ${cols}. ${frame}` },
});

type CanvasProps = {
  run: MazeRun;
  frame: MazeFrame;
  /** Changes when the grid is replaced wholesale, so cells snap instead of animating. */
  gridId: number;
  label: string;
};

/** One maze on the shared grid renderer, filling its box: the single stage and each race lane. */
export const MazeCanvas = ({ run, frame, gridId, label }: CanvasProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GridRenderer | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const { speed, isScrubbing, theme } = useStore(
    useShallow((s) => ({ speed: selectSpeed(s), isScrubbing: s.isScrubbing, theme: s.theme })),
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
    <div ref={wrapperRef} className="relative min-h-0 w-full flex-1">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className="absolute inset-0 h-full w-full select-none"
      />
    </div>
  );
};

/** The single view: one maze being carved. */
export const MazeStage = () => {
  const { run, frame, gridId, algorithm } = useStore(
    useShallow((s) => ({
      run: s.mazes.run,
      frame: s.mazes.run.frameAt(s.frameIndex),
      gridId: s.mazes.inputId,
      algorithm: s.mazes.algorithm,
    })),
  );

  return (
    <div data-tour="bars" className="relative flex h-full min-h-0 min-w-0 flex-col">
      <MazeCanvas
        run={run}
        frame={frame}
        gridId={gridId}
        label={text.onGrid(mazeAlgorithms[algorithm].title, run.rows, run.cols, describeMazeFrame(frame))}
      />
    </div>
  );
};
