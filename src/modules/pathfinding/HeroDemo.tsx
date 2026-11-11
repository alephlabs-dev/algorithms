import { useEffect, useRef } from "react";
import { GridRenderer } from "@/canvas/gridRenderer";
import { pathGridCells, pathPalette } from "./paint";
import { pathAlgorithms } from "./algorithms";
import { applyPreset, emptyGrid, type Preset } from "./grid";
import { pathSearches } from "./searches";
import { PathTimeline } from "./timeline";
import type { Grid, PathAlgorithm } from "./types";
import { count } from "@/utils/count";
import { seededRandom } from "@/utils/random";
import { localized } from "@/i18n";

const text = localized({
  en: {
    visited: (n: number) => `${count(n, "cell")} looked at`,
    path: (n: number) => ` · path ${count(n, "step")}`,
    live: "live",
  },
  es: {
    visited: (n) => `${count(n, "celda")} ${n === 1 ? "revisada" : "revisadas"}`,
    path: (n) => ` · camino de ${count(n, "paso")}`,
    live: "en vivo",
  },
});

const ROWS = 15;
const COLS = 29;
/** Each search gets its own kind of layout, where it has something to show. */
const RUNS: { algorithm: PathAlgorithm; preset: Preset }[] = [
  { algorithm: "astar", preset: "walls" },
  { algorithm: "bfs", preset: "maze" },
  { algorithm: "greedy", preset: "walls" },
  { algorithm: "dijkstra", preset: "terrain" },
];
const RUN_MS = 6000; // how long a search takes to play
const HOLD_MS = 2200; // how long the finished path stays up

/** A layout for run `k` that has a path, so every run ends with one. */
const layoutFor = (k: number): { grid: Grid; timeline: PathTimeline } => {
  const { algorithm, preset } = RUNS[k % RUNS.length];
  for (let seed = 100 + k * 7; ; seed++) {
    const grid = applyPreset(emptyGrid(ROWS, COLS), preset, seededRandom(seed));
    const timeline = new PathTimeline(pathSearches[algorithm], grid);
    if (timeline.frameAt(timeline.length - 1).found) return { grid, timeline };
  }
};

/**
 * The landing page's hero: real searches, one after another, on the same
 * renderer as the app. Pauses while off screen; with reduced motion it shows
 * a finished search instead.
 */
export const HeroDemo = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current!;
    const renderer = new GridRenderer(canvasRef.current!, pathPalette);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let run = 0;
    let { grid, timeline } = layoutFor(run);
    let frameIndex = reduced ? timeline.length - 1 : 0;
    let shown = -1;
    let holdUntil = 0;
    let last = performance.now();
    let visible = true;
    let request = 0;

    const draw = () => {
      if (frameIndex === shown) return;
      shown = frameIndex;
      const frame = timeline.frameAt(frameIndex);
      renderer.update({ ...pathGridCells(grid, frame), gridId: run, fade: reduced ? 0 : 0.15 });
      const { title } = pathAlgorithms[RUNS[run % RUNS.length].algorithm];
      const found = frame.found ? text.path(frame.stats.pathLength) : "";
      if (captionRef.current) captionRef.current.textContent = `${title} · ${text.visited(frame.stats.visited)}${found}`;
    };

    const tick = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      if (visible) {
        const end = timeline.length - 1;
        if (frameIndex < end) {
          frameIndex = Math.min(end, frameIndex + Math.max(1, Math.round((dt * timeline.length) / RUN_MS)));
        } else if (holdUntil === 0) {
          holdUntil = now + HOLD_MS;
        } else if (now >= holdUntil) {
          holdUntil = 0;
          run++;
          ({ grid, timeline } = layoutFor(run));
          frameIndex = 0;
        }
        draw();
      }
      request = requestAnimationFrame(tick);
    };

    const resize = new ResizeObserver(([entry]) => {
      renderer.resize(entry.contentRect.width, entry.contentRect.height, window.devicePixelRatio || 1);
      shown = -1;
      draw();
    });
    resize.observe(wrapper);

    // Off screen, the loop keeps running but does no work.
    const seen = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    seen.observe(wrapper);

    // The theme toggle changes data-theme on <html>: repaint in the new colors.
    const theme = new MutationObserver(() => renderer.refreshColors());
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    draw();
    if (!reduced) request = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(request);
      resize.disconnect();
      seen.disconnect();
      theme.disconnect();
      renderer.destroy();
    };
  }, []);

  return (
    <figure className="m-0 flex min-w-0 flex-col gap-3 rounded-[28px] border border-edge bg-surface p-4 md:p-5">
      <div ref={wrapperRef} className="relative w-full" style={{ aspectRatio: `${COLS} / ${ROWS}` }}>
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
      </div>
      <figcaption className="flex flex-wrap justify-between gap-x-3 gap-y-1 font-mono text-xs text-foreground/70">
        <span ref={captionRef} aria-hidden>
          A* Search
        </span>
        <span>{text.live}</span>
      </figcaption>
    </figure>
  );
};
