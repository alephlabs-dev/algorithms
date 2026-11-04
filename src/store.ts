import { create } from "zustand";
import { Timeline, sortAlgorithms } from "./algorithms";
import { MAX_MOBILE_SIZE } from "./consts/sizesMap";
import {
  applyPreset,
  decodeCells,
  emptyGrid,
  gridDimensions,
  pathSearches,
  PathTimeline,
  type Grid,
  type GridSize,
  type PathAlgorithm,
  type Preset,
} from "./pathfinding";
import { readLocation } from "./urlState";
import { generateItems } from "./utils/generateItems";
import { newSeed, seededRandom } from "./utils/random";
import { DEFAULT_PRESET, speedFor, type SpeedPreset } from "./utils/speed";
import type { Algorithm, DisplayMode, InputOrder } from "./types";

export type View = "single" | "race";
/** Which visualizer is on stage. */
export type Module = "sorting" | "pathfinding";
/** What dragging on the grid paints. */
export type Brush = "wall" | "mud";
export type Theme = "dark" | "light";

const THEME_COLORS: Record<Theme, string> = { dark: "#0b0f0d", light: "#f2f5f9" };

const TOUR_KEY = "tour-done";

const tourDone = () => {
  try {
    return localStorage.getItem(TOUR_KEY) === "true";
  } catch {
    return false;
  }
};

export const MIN_RACERS = 2;
export const MAX_RACERS = 4;

export type StoreState = {
  isMobile: boolean;
  module: Module;
  pathAlgorithm: PathAlgorithm;
  gridSize: GridSize;
  grid: Grid;
  /** The last preset applied, so "new maze" (R) makes another of the same kind. */
  gridPreset: Preset;
  brush: Brush;
  /** The whole search on the current grid, precomputed. */
  pathTimeline: PathTimeline;
  /** Bumped when the grid is replaced wholesale (size, preset), so cells don't animate between layouts. */
  gridId: number;
  /** One algorithm with all the details, or several racing on the same array. */
  view: View;
  /** On the home page (/): the default algorithm shows, but the URL stays / until something is picked. */
  isHome: boolean;
  raceAlgorithms: Algorithm[];
  /** One timeline per racer, on the same array as `timeline`. Empty outside race view. */
  raceTimelines: Timeline[];
  activeAlgorithm: Algorithm;
  size: number;
  displayMode: DisplayMode;
  /** How the generated array starts out (random, reversed...). */
  inputOrder: InputOrder;
  /** Effective speed, 0–1 on an exponential scale (see utils/speed). Derived from the preset. */
  speed: number;
  /** The chosen speed, relative to a pace picked for each run. */
  speedPreset: SpeedPreset;
  /** Seeds the current array, so a link can reproduce it exactly. */
  seed: number;
  /** Bumped on every new array so bars remount instead of animating. */
  arrayId: number;
  /** The whole run, precomputed. Frame 0 is the unsorted array. */
  timeline: Timeline;
  /**
   * Playback position. In single view it's a frame index; in race view it's a
   * count of operations, so every lane runs on the same, fair clock.
   */
  frameIndex: number;
  isPlaying: boolean;
  /** The progress bar is being dragged: bars jump to place instead of animating. */
  isScrubbing: boolean;
  /** The keyboard shortcuts help is open. */
  isHelpOpen: boolean;
  /** Dark (default) or light; saved in this browser and applied by index.html before first paint. */
  theme: Theme;
  /** The guided tour is showing. Opens by itself on the first visit. */
  isTourOpen: boolean;

  setIsMobile: (isMobile: boolean) => void;
  setView: (view: View) => void;
  toggleRaceAlgorithm: (algorithm: Algorithm) => void;
  /** Switch to race view with `algorithm` among the racers. */
  raceWith: (algorithm: Algorithm) => void;
  setDisplayMode: (displayMode: DisplayMode) => void;
  setActiveAlgorithm: (algorithm: Algorithm) => void;
  setSize: (size: number) => void;
  setInputOrder: (inputOrder: InputOrder) => void;
  setSpeedPreset: (preset: SpeedPreset) => void;
  setScrubbing: (isScrubbing: boolean) => void;
  setHelpOpen: (isHelpOpen: boolean) => void;
  setTheme: (theme: Theme) => void;
  openTour: () => void;
  /** Closes the tour (finished or skipped) and remembers it was seen. */
  closeTour: () => void;
  createNewArray: () => void;
  setPathAlgorithm: (algorithm: PathAlgorithm) => void;
  setGridSize: (size: GridSize) => void;
  setBrush: (brush: Brush) => void;
  /** Replaces the grid after an edit (painting, moving a marker); the search restarts. */
  editGrid: (grid: Grid) => void;
  applyGridPreset: (preset: Preset) => void;

  play: () => void;
  pause: () => void;
  /** Moves `steps` frames ahead and stops at the end. Called by the playback loop. */
  advanceBy: (steps: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  seek: (frameIndex: number) => void;
};

export const selectFrame = (state: StoreState) =>
  state.timeline.frameAt(state.frameIndex);
export const selectPathFrame = (state: StoreState) => state.pathTimeline.frameAt(state.frameIndex);
export const selectLastIndex = (state: StoreState) =>
  state.module === "pathfinding"
    ? state.pathTimeline.length - 1
    : state.view === "race"
    ? Math.max(0, ...state.raceTimelines.map((t) => t.totalOps))
    : state.timeline.length - 1;

export const MOBILE_QUERY = "(max-width: 768px)";

/** Numbers mode only fits so many tiles, and phones only so many bars. */
const maxSizeFor = (displayMode: DisplayMode, isMobile: boolean) =>
  displayMode === "numbers" ? (isMobile ? 10 : 20) : isMobile ? MAX_MOBILE_SIZE : Infinity;

const timelineFor = (algorithm: Algorithm, items: readonly number[]) =>
  new Timeline(sortAlgorithms[algorithm], items);

const newRun = (algorithm: Algorithm, items: readonly number[]) => ({
  timeline: timelineFor(algorithm, items),
  frameIndex: 0,
  isPlaying: false,
});

const itemsFor = (size: number, order: InputOrder, seed: number) =>
  generateItems(size, order, seededRandom(seed));

// In sidebar order, like any selection the user makes.
const DEFAULT_RACERS: Algorithm[] = ["insertion", "bubble", "quick", "merge"];

const raceTimelinesFor = (view: View, algorithms: Algorithm[], items: readonly number[]) =>
  view === "race" ? algorithms.map((a) => timelineFor(a, items)) : [];

const pathTimelineFor = (algorithm: PathAlgorithm, grid: Grid) => new PathTimeline(pathSearches[algorithm], grid);

/** A fresh grid of the given size with a preset applied. */
const gridFor = (size: GridSize, isMobile: boolean, preset: Preset) => {
  const { rows, cols } = gridDimensions(size, isMobile);
  return applyPreset(emptyGrid(rows, cols), preset, seededRandom(newSeed()));
};

/** The grid a link describes, if it's valid for the size; otherwise a fresh maze. */
const gridFromLink = (link: ReturnType<typeof readLocation>["path"], size: GridSize, isMobile: boolean) => {
  const { rows, cols } = gridDimensions(size, isMobile);
  const cells = link.cells ? decodeCells(link.cells, rows * cols) : null;
  const inside = (cell: number | undefined): cell is number => cell !== undefined && cell < rows * cols;
  if (!cells || !inside(link.start) || !inside(link.end) || link.start === link.end) return gridFor(size, isMobile, "maze");
  cells[link.start] = 0;
  cells[link.end] = 0;
  return { rows, cols, cells, start: link.start, end: link.end };
};

// Start from the link's settings when there are any.
const initial = (() => {
  const url = readLocation(window.location.pathname, window.location.search);
  const isMobile = window.matchMedia(MOBILE_QUERY).matches;
  const displayMode = url.displayMode ?? "bars";
  const size = Math.min(url.size ?? (isMobile ? 20 : 40), maxSizeFor(displayMode, isMobile));
  const inputOrder = url.inputOrder ?? "random";
  const seed = url.seed ?? newSeed();
  const activeAlgorithm = url.algorithm ?? "selection";
  const view = url.view ?? "single";
  const raceAlgorithms = url.raceAlgorithms ?? DEFAULT_RACERS;
  const items = itemsFor(size, inputOrder, seed);
  const raceTimelines = raceTimelinesFor(view, raceAlgorithms, items);
  const timeline = timelineFor(activeAlgorithm, items);
  const module: Module = url.pathAlgorithm ? "pathfinding" : "sorting";
  const pathAlgorithm = url.pathAlgorithm ?? "astar";
  const gridSize = url.path.gridSize ?? (isMobile ? "small" : "medium");
  const grid = gridFromLink(url.path, gridSize, isMobile);
  const pathTimeline = pathTimelineFor(pathAlgorithm, grid);
  const lastIndex =
    module === "pathfinding"
      ? pathTimeline.length - 1
      : view === "race"
        ? Math.max(...raceTimelines.map((t) => t.totalOps))
        : timeline.length - 1;
  return {
    isMobile,
    module,
    pathAlgorithm,
    gridSize,
    grid,
    gridPreset: "maze" as Preset,
    brush: "wall" as Brush,
    pathTimeline,
    isHome: url.isHome,
    view,
    raceAlgorithms,
    raceTimelines,
    activeAlgorithm,
    size,
    displayMode,
    inputOrder,
    speedPreset: url.speed ?? DEFAULT_PRESET,
    speed: speedFor(url.speed ?? DEFAULT_PRESET, lastIndex, module === "pathfinding" ? "pathfinding" : view),
    seed,
    timeline,
  };
})();

export const useStore = create<StoreState>((set, get) => {
  /** Call after any change that creates a new run. */
  const applyAutoSpeed = () => {
    const state = get();
    const pace = state.module === "pathfinding" ? "pathfinding" : state.view;
    set({ speed: speedFor(state.speedPreset, selectLastIndex(state), pace) });
  };

  return {
    ...initial,
    arrayId: 0,
    gridId: 0,
    frameIndex: 0,
    isPlaying: false,
    isScrubbing: false,
    isHelpOpen: false,
    theme: document.documentElement.dataset.theme === "light" ? "light" : "dark",

    // The tour walks through sorting; a first visit straight to a pathfinding page skips it.
    isTourOpen: !tourDone() && initial.view === "single" && initial.module === "sorting",
    openTour: () => {
      // The tour walks through the single sorting view.
      if (get().view === "race") get().setView("single");
      if (get().module === "pathfinding") get().setActiveAlgorithm(get().activeAlgorithm);
      get().pause();
      set({ isTourOpen: true, isHelpOpen: false });
    },
    closeTour: () => {
      try {
        localStorage.setItem(TOUR_KEY, "true");
      } catch {
        // Blocked storage: the tour may open again next visit.
      }
      set({ isTourOpen: false });
    },

    setTheme: (theme) => {
      document.documentElement.dataset.theme = theme;
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
      try {
        localStorage.setItem("theme", theme);
      } catch {
        // Private mode or blocked storage: the theme still applies for this visit.
      }
      set({ theme });
    },

    // Shrinks the array if the screen got too small for it (e.g. rotating a tablet).
    setIsMobile: (isMobile) => {
      const before = get();
      set({ isMobile });
      // Phones and wide screens use differently shaped grids.
      if (before.isMobile !== isMobile) get().setGridSize(before.gridSize);
      const { size, displayMode, setSize } = get();
      const maxSize = maxSizeFor(displayMode, isMobile);
      if (size > maxSize) setSize(maxSize);
    },

    setView: (view) => {
      set((state) => ({
        view,
        // Races are a sorting feature.
        module: "sorting",
        isHome: false,
        frameIndex: 0,
        isPlaying: false,
        raceTimelines: raceTimelinesFor(view, state.raceAlgorithms, state.timeline.values),
      }));
      applyAutoSpeed();
    },

    // Keeps between MIN_RACERS and MAX_RACERS lanes, in the sidebar's order.
    raceWith: (algorithm) => {
      const { raceAlgorithms, setView } = get();
      if (!raceAlgorithms.includes(algorithm)) {
        // Replace the last racer if the race is full; keep the sidebar order.
        const kept = raceAlgorithms.length >= MAX_RACERS ? raceAlgorithms.slice(0, -1) : raceAlgorithms;
        const order = Object.keys(sortAlgorithms) as Algorithm[];
        set({ raceAlgorithms: order.filter((a) => a === algorithm || kept.includes(a)) });
      }
      setView("race");
    },

    toggleRaceAlgorithm: (algorithm) => {
      set((state) => {
        const selected = state.raceAlgorithms.includes(algorithm);
        const count = state.raceAlgorithms.length;
        if ((selected && count <= MIN_RACERS) || (!selected && count >= MAX_RACERS)) return {};
        const order = Object.keys(sortAlgorithms) as Algorithm[];
        const raceAlgorithms = order.filter((a) =>
          a === algorithm ? !selected : state.raceAlgorithms.includes(a)
        );
        return {
          raceAlgorithms,
          frameIndex: 0,
          isPlaying: false,
          raceTimelines: raceTimelinesFor(state.view, raceAlgorithms, state.timeline.values),
        };
      });
      applyAutoSpeed();
    },

    setDisplayMode: (displayMode) => {
      set({ displayMode });
      const { size, isMobile, setSize } = get();
      const maxSize = maxSizeFor(displayMode, isMobile);
      if (size > maxSize) setSize(maxSize);
    },

    // Keeps the same array so algorithms can be compared on identical data.
    setActiveAlgorithm: (algorithm) => {
      set((state) => ({
        activeAlgorithm: algorithm,
        module: "sorting",
        isHome: false,
        ...newRun(algorithm, state.timeline.values),
      }));
      applyAutoSpeed();
    },

    setSize: (size) => {
      set((state) => {
        const seed = newSeed();
        const items = itemsFor(size, state.inputOrder, seed);
        return {
          size,
          seed,
          arrayId: state.arrayId + 1,
          raceTimelines: raceTimelinesFor(state.view, state.raceAlgorithms, items),
          ...newRun(state.activeAlgorithm, items),
        };
      });
      applyAutoSpeed();
    },

    setInputOrder: (inputOrder) => {
      set({ inputOrder });
      get().createNewArray();
    },

    setSpeedPreset: (speedPreset) => {
      set({ speedPreset });
      applyAutoSpeed();
    },
    setScrubbing: (isScrubbing) => set({ isScrubbing }),
    setHelpOpen: (isHelpOpen) => set({ isHelpOpen }),

    createNewArray: () => {
      const { module, gridPreset, applyGridPreset, setSize, size } = get();
      // In pathfinding, "new" means another layout of the same kind (a clear grid becomes a maze).
      if (module === "pathfinding") applyGridPreset(gridPreset === "clear" ? "maze" : gridPreset);
      else setSize(size);
    },

    // The grid stays the same so algorithms can be compared on it.
    setPathAlgorithm: (algorithm) => {
      set((state) => ({
        module: "pathfinding",
        view: "single",
        isHome: false,
        pathAlgorithm: algorithm,
        pathTimeline: pathTimelineFor(algorithm, state.grid),
        frameIndex: 0,
        isPlaying: false,
      }));
      applyAutoSpeed();
    },

    setGridSize: (gridSize) => {
      set((state) => {
        const grid = gridFor(gridSize, state.isMobile, state.gridPreset);
        return {
          gridSize,
          grid,
          gridId: state.gridId + 1,
          pathTimeline: pathTimelineFor(state.pathAlgorithm, grid),
          frameIndex: 0,
          isPlaying: false,
        };
      });
      applyAutoSpeed();
    },

    setBrush: (brush) => set({ brush }),

    editGrid: (grid) => {
      set((state) => ({
        grid,
        pathTimeline: pathTimelineFor(state.pathAlgorithm, grid),
        frameIndex: 0,
        isPlaying: false,
      }));
      applyAutoSpeed();
    },

    applyGridPreset: (gridPreset) => {
      set((state) => {
        const grid = applyPreset(state.grid, gridPreset, seededRandom(newSeed()));
        return {
          gridPreset,
          grid,
          gridId: state.gridId + 1,
          pathTimeline: pathTimelineFor(state.pathAlgorithm, grid),
          frameIndex: 0,
          isPlaying: false,
        };
      });
      applyAutoSpeed();
    },

    play: () =>
      set((state) => ({
        isPlaying: true,
        // Replay from the start if the run already finished.
        frameIndex: state.frameIndex >= selectLastIndex(state) ? 0 : state.frameIndex,
      })),

    pause: () => set({ isPlaying: false }),

    advanceBy: (steps) =>
      set((state) => {
        const lastIndex = selectLastIndex(state);
        const frameIndex = Math.min(state.frameIndex + steps, lastIndex);
        return { frameIndex, isPlaying: frameIndex < lastIndex };
      }),

    stepForward: () =>
      set((state) => ({
        isPlaying: false,
        frameIndex: Math.min(state.frameIndex + 1, selectLastIndex(state)),
      })),

    stepBackward: () =>
      set((state) => ({
        isPlaying: false,
        frameIndex: Math.max(state.frameIndex - 1, 0),
      })),

    seek: (frameIndex) =>
      set((state) => ({
        frameIndex: Math.min(Math.max(frameIndex, 0), selectLastIndex(state)),
      })),
  };
});
