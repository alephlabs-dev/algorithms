import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { FourierRenderer } from "@/canvas/fourierRenderer";
import { fourierSeries } from "@/consts/fourierSeries";
import type { Point } from "@/fourier";
import { useElementSize } from "@/hooks/useElementSize";
import { useStore } from "@/store";
import { count } from "@/utils/count";
import { localized } from "@/i18n";

const text = localized({
  en: {
    drawingArea: "Drawing area: draw a closed shape in one stroke.",
    builtFrom: (title: string, circles: number, error: string) =>
      `${title} built from ${count(circles, "circle")}. Off by ${error}% on average.`,
    drawHere: "Draw a shape here in one stroke. It closes itself.",
  },
  es: {
    drawingArea: "Área de dibujo: dibuja una forma cerrada de un solo trazo.",
    builtFrom: (title, circles, error) =>
      `${title}, con ${circles} ${circles === 1 ? "círculo" : "círculos"}. Error promedio de ${error}%.`,
    drawHere: "Dibuja aquí una forma de un solo trazo. Se cierra sola.",
  },
});


/** A stroke this short or small isn't a shape yet. */
const MIN_POINTS = 12;
const MIN_SIZE = 40;

/**
 * The circles at work: on the left of a wave they build, or in the middle of
 * a drawing they retrace. Choosing to draw your own turns the stage into a
 * canvas for one stroke, which closes itself.
 */
export const FourierStage = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FourierRenderer | null>(null);
  const strokeRef = useRef<Point[] | null>(null);
  const [stroke, setStroke] = useState<Point[] | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const { run, frameIndex, theme, algorithm, drawing, circles } = useStore(
    useShallow((s) => ({
      run: s.fourier.run,
      frameIndex: s.frameIndex,
      theme: s.theme,
      algorithm: s.fourier.algorithm,
      // Waiting for a shape: "Draw" picked, nothing drawn yet.
      drawing: s.fourier.algorithm === "epicycles" && s.fourier.shape === "custom" && s.fourier.path === null,
      circles: s.fourier.circles,
    })),
  );

  useEffect(() => {
    rendererRef.current = new FourierRenderer(canvasRef.current!);
  }, []);

  useEffect(() => {
    rendererRef.current?.resize(width, height, window.devicePixelRatio || 1);
  }, [width, height]);

  useEffect(() => {
    rendererRef.current?.refreshColors();
  }, [theme]);

  useEffect(() => {
    rendererRef.current?.update({ run, frameIndex, stroke: drawing ? (stroke ?? []) : null });
  }, [run, frameIndex, drawing, stroke]);

  const pointFrom = (event: PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    strokeRef.current = [pointFrom(event)];
    setStroke(strokeRef.current);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const current = strokeRef.current;
    if (!current) return;
    const point = pointFrom(event);
    const last = current[current.length - 1];
    if (Math.hypot(point.x - last.x, point.y - last.y) < 3) return;
    strokeRef.current = [...current, point];
    setStroke(strokeRef.current);
  };

  const onPointerUp = () => {
    const current = strokeRef.current;
    strokeRef.current = null;
    if (!current) return;
    const xs = current.map((p) => p.x);
    const ys = current.map((p) => p.y);
    const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    setStroke(null);
    if (current.length < MIN_POINTS || size < MIN_SIZE) return;
    useStore.getState().actions.fourier.setPath(current);
  };

  const { title } = fourierSeries[algorithm];
  const label = drawing
    ? text.drawingArea
    : text.builtFrom(title, circles, (run.error * 100).toFixed(1));

  return (
    <div data-tour="bars" className="relative flex h-full min-h-0 min-w-0 flex-col">
      <div ref={wrapperRef} className="relative min-h-0 w-full flex-1">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={label}
          className="absolute inset-0 h-full w-full touch-none select-none"
          style={{ cursor: drawing ? "crosshair" : "default" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {drawing && !stroke && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center text-lg text-foreground/70">
            {text.drawHere}
          </p>
        )}
      </div>
    </div>
  );
};
