import { create } from "zustand";
import { Timeline, sortAlgorithms } from "./algorithms";
import { MAX_MOBILE_SIZE } from "./consts/sizesMap";
import { readUrlState } from "./urlState";
import { generateItems } from "./utils/generateItems";
import { newSeed, seededRandom } from "./utils/random";
import { DEFAULT_SPEED } from "./utils/speed";
import type { Algorithm, DisplayMode, InputOrder } from "./types";

export type StoreState = {
  isMobile: boolean;
  activeAlgorithm: Algorithm;
  size: number;
  displayMode: DisplayMode;
  /** How the generated array starts out (random, reversed...). */
  inputOrder: InputOrder;
  /** Slider position, 0–1 on an exponential scale (see utils/speed). */
  speed: number;
  /** Seeds the current array, so a link can reproduce it exactly. */
  seed: number;
  /** Bumped on every new array so bars remount instead of animating. */
  arrayId: number;
  /** The whole run, precomputed. Frame 0 is the unsorted array. */
  timeline: Timeline;
  frameIndex: number;
  isPlaying: boolean;

  setIsMobile: (isMobile: boolean) => void;
  setDisplayMode: (displayMode: DisplayMode) => void;
  setActiveAlgorithm: (algorithm: Algorithm) => void;
  setSize: (size: number) => void;
  setInputOrder: (inputOrder: InputOrder) => void;
  setSpeed: (speed: number) => void;
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
export const selectLastIndex = (state: StoreState) => state.timeline.length - 1;

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

// Start from the link's settings when there are any.
const initial = (() => {
  const url = readUrlState(window.location.search);
  const isMobile = window.matchMedia(MOBILE_QUERY).matches;
  const displayMode = url.displayMode ?? "bars";
  const size = Math.min(url.size ?? (isMobile ? 20 : 40), maxSizeFor(displayMode, isMobile));
  const inputOrder = url.inputOrder ?? "random";
  const seed = url.seed ?? newSeed();
  const activeAlgorithm = url.algorithm ?? "selection";
  return {
    isMobile,
    activeAlgorithm,
    size,
    displayMode,
    inputOrder,
    speed: url.speed ?? DEFAULT_SPEED,
    seed,
    timeline: timelineFor(activeAlgorithm, itemsFor(size, inputOrder, seed)),
  };
})();

export const useStore = create<StoreState>((set, get) => ({
  ...initial,
  arrayId: 0,
  frameIndex: 0,
  isPlaying: false,

  // Shrinks the array if the screen got too small for it (e.g. rotating a tablet).
  setIsMobile: (isMobile) => {
    set({ isMobile });
    const { size, displayMode, setSize } = get();
    const maxSize = maxSizeFor(displayMode, isMobile);
    if (size > maxSize) setSize(maxSize);
  },

  setDisplayMode: (displayMode) => {
    set({ displayMode });
    const { size, isMobile, setSize } = get();
    const maxSize = maxSizeFor(displayMode, isMobile);
    if (size > maxSize) setSize(maxSize);
  },

  // Keeps the same array so algorithms can be compared on identical data.
  setActiveAlgorithm: (algorithm) =>
    set((state) => ({
      activeAlgorithm: algorithm,
      ...newRun(algorithm, state.timeline.values),
    })),

  setSize: (size) =>
    set((state) => {
      const seed = newSeed();
      return {
        size,
        seed,
        arrayId: state.arrayId + 1,
        ...newRun(state.activeAlgorithm, itemsFor(size, state.inputOrder, seed)),
      };
    }),

  setInputOrder: (inputOrder) => {
    set({ inputOrder });
    get().createNewArray();
  },

  setSpeed: (speed) => set({ speed }),

  createNewArray: () => get().setSize(get().size),

  play: () =>
    set((state) => ({
      isPlaying: true,
      // Replay from the start if the run already finished.
      frameIndex:
        state.frameIndex >= state.timeline.length - 1 ? 0 : state.frameIndex,
    })),

  pause: () => set({ isPlaying: false }),

  advanceBy: (steps) =>
    set((state) => {
      const lastIndex = state.timeline.length - 1;
      const frameIndex = Math.min(state.frameIndex + steps, lastIndex);
      return { frameIndex, isPlaying: frameIndex < lastIndex };
    }),

  stepForward: () =>
    set((state) => ({
      isPlaying: false,
      frameIndex: Math.min(state.frameIndex + 1, state.timeline.length - 1),
    })),

  stepBackward: () =>
    set((state) => ({
      isPlaying: false,
      frameIndex: Math.max(state.frameIndex - 1, 0),
    })),

  seek: (frameIndex) =>
    set((state) => ({
      frameIndex: Math.min(Math.max(frameIndex, 0), state.timeline.length - 1),
    })),
}));
