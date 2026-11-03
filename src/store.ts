import { create } from "zustand";
import { recordFrames, sortAlgorithms, type Frame } from "./algorithms";
import { generateUniqueRandomItems } from "./utils/generateItems";
import type { Algorithm, DisplayMode } from "./types";

export type StoreState = {
  isMobile: boolean;
  activeAlgorithm: Algorithm;
  size: number;
  displayMode: DisplayMode;
  /** Delay between frames in ms (0–1000). */
  speed: number;
  /** Bumped on every new array so bars remount instead of animating. */
  arrayId: number;
  /** The whole run, precomputed. frames[0] is the unsorted array. */
  frames: Frame[];
  frameIndex: number;
  isPlaying: boolean;

  setIsMobile: (isMobile: boolean) => void;
  setDisplayMode: (displayMode: DisplayMode) => void;
  setActiveAlgorithm: (algorithm: Algorithm) => void;
  setSize: (size: number) => void;
  setSpeed: (speed: number) => void;
  createNewArray: () => void;

  play: () => void;
  pause: () => void;
  /** Moves to the next frame and stops at the end. Called by the playback timer. */
  advance: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  seek: (frameIndex: number) => void;
};

export const selectFrame = (state: StoreState) => state.frames[state.frameIndex];

const maxSizeFor = (displayMode: DisplayMode, isMobile: boolean) =>
  displayMode === "numbers" ? (isMobile ? 10 : 20) : Infinity;

const framesFor = (algorithm: Algorithm, items: readonly number[]) =>
  recordFrames(sortAlgorithms[algorithm], items);

const newRun = (algorithm: Algorithm, items: readonly number[]) => ({
  frames: framesFor(algorithm, items),
  frameIndex: 0,
  isPlaying: false,
});

const INITIAL_SIZE = 30;
const INITIAL_ALGORITHM: Algorithm = "selection";

export const useStore = create<StoreState>((set, get) => ({
  isMobile: false,
  activeAlgorithm: INITIAL_ALGORITHM,
  size: INITIAL_SIZE,
  displayMode: "bars",
  speed: 500,
  arrayId: 0,
  ...newRun(INITIAL_ALGORITHM, generateUniqueRandomItems(INITIAL_SIZE)),

  setIsMobile: (isMobile) => set({ isMobile }),

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
      ...newRun(algorithm, state.frames[0].items),
    })),

  setSize: (size) =>
    set((state) => ({
      size,
      arrayId: state.arrayId + 1,
      ...newRun(state.activeAlgorithm, generateUniqueRandomItems(size)),
    })),

  setSpeed: (speed) => set({ speed }),

  createNewArray: () => get().setSize(get().size),

  play: () =>
    set((state) => ({
      isPlaying: true,
      // Replay from the start if the run already finished.
      frameIndex:
        state.frameIndex >= state.frames.length - 1 ? 0 : state.frameIndex,
    })),

  pause: () => set({ isPlaying: false }),

  advance: () =>
    set((state) => {
      const lastIndex = state.frames.length - 1;
      const frameIndex = Math.min(state.frameIndex + 1, lastIndex);
      return { frameIndex, isPlaying: frameIndex < lastIndex };
    }),

  stepForward: () =>
    set((state) => ({
      isPlaying: false,
      frameIndex: Math.min(state.frameIndex + 1, state.frames.length - 1),
    })),

  stepBackward: () =>
    set((state) => ({
      isPlaying: false,
      frameIndex: Math.max(state.frameIndex - 1, 0),
    })),

  seek: (frameIndex) =>
    set((state) => ({
      frameIndex: Math.min(Math.max(frameIndex, 0), state.frames.length - 1),
    })),
}));
