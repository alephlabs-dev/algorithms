import { create } from "zustand";
import { Timeline, sortAlgorithms } from "./algorithms";
import { MAX_MOBILE_SIZE } from "./consts/sizesMap";
import { readUrlState } from "./urlState";
import { generateItems } from "./utils/generateItems";
import { newSeed, seededRandom } from "./utils/random";
import { DEFAULT_PRESET, speedFor, type SpeedPreset } from "./utils/speed";
import type { Algorithm, DisplayMode, InputOrder } from "./types";

export type View = "single" | "race";
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
  /** One algorithm with all the details, or several racing on the same array. */
  view: View;
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
export const selectLastIndex = (state: StoreState) =>
  state.view === "race"
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

// Start from the link's settings when there are any.
const initial = (() => {
  const url = readUrlState(window.location.search);
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
  const lastIndex =
    view === "race" ? Math.max(...raceTimelines.map((t) => t.totalOps)) : timeline.length - 1;
  return {
    isMobile,
    view,
    raceAlgorithms,
    raceTimelines,
    activeAlgorithm,
    size,
    displayMode,
    inputOrder,
    speedPreset: url.speed ?? DEFAULT_PRESET,
    speed: speedFor(url.speed ?? DEFAULT_PRESET, lastIndex, view),
    seed,
    timeline,
  };
})();

export const useStore = create<StoreState>((set, get) => {
  /** Call after any change that creates a new run. */
  const applyAutoSpeed = () => {
    const state = get();
    set({ speed: speedFor(state.speedPreset, selectLastIndex(state), state.view) });
  };

  return {
    ...initial,
    arrayId: 0,
    frameIndex: 0,
    isPlaying: false,
    isScrubbing: false,
    isHelpOpen: false,
    theme: document.documentElement.dataset.theme === "light" ? "light" : "dark",

    isTourOpen: !tourDone() && initial.view === "single",
    openTour: () => {
      // The tour walks through the single view.
      if (get().view === "race") get().setView("single");
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
      set({ isMobile });
      const { size, displayMode, setSize } = get();
      const maxSize = maxSizeFor(displayMode, isMobile);
      if (size > maxSize) setSize(maxSize);
    },

    setView: (view) => {
      set((state) => ({
        view,
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

    createNewArray: () => get().setSize(get().size),

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
