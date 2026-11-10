import { create } from "zustand";
import { FEEDBACK_MS, forgetAnswers, isAnswered, isCellQuestion, markAnswered, NEW_SCORE, type Answer, type GameScore, type Question } from "./game";
import {
  contextFor,
  engines,
  MODULES,
  slices,
  type ModuleId,
  type SliceActions,
  type SliceAlgorithm,
  type SliceStates,
} from "./modules/engine";
import type { Link, Patch, SliceContext } from "./modules/slice";
import { linkFor, type UrlLocation } from "./urlState";
import { DEFAULT_PRESET, type SpeedPreset } from "./utils/speed";

export type View = "single" | "race";
/** Which visualizer is on stage. */
export type Module = ModuleId;
export type Theme = "dark" | "light";
export { MAX_RACERS, MIN_RACERS } from "./modules/slice";

export const tourDone = (module: Module) => {
  try {
    return localStorage.getItem(slices[module].tourKey) === "true";
  } catch {
    return false;
  }
};

/**
 * Every module's slice (see modules/slice.ts) under its id, and what they share:
 * the module on stage, the view, playback, guess mode, the screen and the theme.
 */
export type StoreState = SliceStates & {
  isMobile: boolean;
  /** The window is taller than wide: grids and graphs are laid out upright. */
  isPortrait: boolean;
  module: Module;
  /** One algorithm with all the details, or several racing on the same input. */
  view: View;
  /** On the landing page (/), in front of the modules. */
  isLanding: boolean;
  /** On a module's own page (/sorting, /pathfinding): its algorithm shows, but the URL stays there until something is picked. */
  isModuleStart: boolean;
  /** The chosen speed, relative to a pace picked for each run. */
  speedPreset: SpeedPreset;
  /**
   * Playback position. In single view it's a frame index; in race view it's the
   * race clock (operations in sorting, cells examined in pathfinding…), so every
   * lane runs on the same, fair clock.
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

  /** Each module's actions: `actions.fourier.setCircles(25)`. Actions replace the run; settings leave it. */
  actions: SliceActions;
  /** Puts a module's algorithm on stage, in single view. */
  pick: <M extends Module>(module: M, algorithm: SliceAlgorithm<M>) => void;
  /** Switches to the module's race with `racer` among the racers. */
  raceWith: <M extends Module>(module: M, racer: SliceAlgorithm<M>) => void;
  setView: (view: View) => void;
  /** "New": another input of the same kind for the module on stage. */
  createNewArray: () => void;
  setIsMobile: (isMobile: boolean) => void;
  setIsPortrait: (isPortrait: boolean) => void;
  setSpeedPreset: (preset: SpeedPreset) => void;
  setScrubbing: (isScrubbing: boolean) => void;
  setHelpOpen: (isHelpOpen: boolean) => void;
  setTheme: (theme: Theme) => void;
  openTour: () => void;
  /** Closes the tour (finished or skipped) and remembers it was seen. */
  closeTour: () => void;

  play: () => void;
  /** Guess mode: playback stops before the frames that would give an answer away, and asks. */
  isGameOn: boolean;
  gameScore: GameScore;
  /** The question waiting for an answer, if any. */
  gameQuestion: Question | null;
  /** How the last answer went, for a moment, and the question it answered. `id` is when, from Date.now(). */
  gameFeedback: { right: boolean; text: string; id: number; question: Question } | null;
  toggleGame: () => void;
  answerGame: (answer: Answer) => void;
  /** A clean score, and every question of the run on stage asked again. */
  resetGame: () => void;
  pause: () => void;
  /** Moves `steps` frames ahead and stops at the end. Called by the playback loop. */
  advanceBy: (steps: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  seek: (frameIndex: number) => void;
};

export const selectFrame = (state: StoreState) => state.sorting.run.frameAt(state.frameIndex);
export const selectPathFrame = (state: StoreState) => state.pathfinding.run.frameAt(state.frameIndex);
export const selectLastIndex = (state: StoreState) => engines[state.module].lastIndex(state, state.view);

/** The runs the race lanes show: one per racer of the module on stage, none outside race view. */
export const selectRaceRuns = (state: StoreState): readonly unknown[] => {
  if (state.view !== "race") return [];
  const slice: object = state[state.module];
  return "raceRuns" in slice ? (slice.raceRuns as readonly unknown[]) : [];
};
// The playback speed is derived too: selectSpeed lives in modules/engine, so tests can import it without a browser.

/** Guess mode's questions for the run on stage (none in a race, or without guess mode). */
export const gameQuestionsOf = (state: StoreState): Question[] =>
  state.isGameOn && state.view === "single" ? (engines[state.module].game?.(state) ?? []) : [];

/** Guess mode is on and can play the run on stage. */
export const selectGuessPlaying = (state: StoreState) =>
  state.isGameOn &&
  state.view === "single" &&
  engines[state.module].game !== undefined &&
  !engines[state.module].gameUnavailable?.(state);

/** The first unanswered question between the current frame and `target`: playback stops before it. */
const nextQuestion = (state: StoreState, target: number) =>
  gameQuestionsOf(state).find((q) => q.at > state.frameIndex && q.at <= target && !isAnswered(q)) ?? null;

/**
 * A question that marks grid cells with letters waits while the last answer's explanation
 * is still up: its letters would be the new question's too, pointing at other cells.
 */
const waitsForFeedback = (state: StoreState, q: Question) =>
  isCellQuestion(q) &&
  state.gameFeedback !== null &&
  Date.now() - state.gameFeedback.id < FEEDBACK_MS;

/** The question on screen: only while its run is on stage and playback sits right before it. */
export const selectGameQuestion = (state: StoreState) => {
  const q = state.gameQuestion;
  if (!q || state.frameIndex !== q.at - 1) return null;
  return gameQuestionsOf(state).includes(q) ? q : null;
};

export const MOBILE_QUERY = "(max-width: 768px)";
export const PORTRAIT_QUERY = "(orientation: portrait)";

/**
 * What the store starts from, read from the browser by store.ts: the link it opened on
 * and the screen. Passing it in keeps the store free of `window`, so tests can build one.
 */
export type StoreEnv = {
  url: UrlLocation;
  isMobile: boolean;
  isPortrait: boolean;
  theme: Theme;
};

/**
 * The slices without their own types, so the store can loop over them. Each slice's
 * types still hold where it's declared (defineModule) and for callers (SliceActions).
 */
type LooseAction = (slice: object, ctx: SliceContext, ...args: unknown[]) => Patch<object>;
type LooseSlice = {
  hydrate: (link: Link, ctx: SliceContext) => object;
  current: (slice: object) => string;
  pick: (slice: object, ctx: SliceContext, algorithm: string) => object;
  actions: Record<string, LooseAction>;
  settings?: Record<string, LooseAction>;
  playFrom?: Record<string, ((slice: object, ctx: SliceContext) => number) | undefined>;
  addRacer?: (slice: object, racer: string) => object;
  forView?: (slice: object, ctx: SliceContext) => object;
  fit?: (slice: object, ctx: SliceContext) => Patch<object>;
  newInput: (slice: object, ctx: SliceContext) => Patch<object>;
};
const loose = slices as unknown as Record<Module, LooseSlice>;

/** One module's slice changed, as a store update; null when nothing changes. */
const patchSlice = (
  state: StoreState,
  module: Module,
  change: (slice: object, ctx: SliceContext) => Patch<object>,
  ctx = contextFor(state, module),
): Partial<StoreState> | null => {
  const patch = change(state[module], ctx);
  return patch && ({ [module]: { ...state[module], ...patch } } as Partial<StoreState>);
};

/** Several slice updates as one; null when none changes anything. */
const merged = (patches: (Partial<StoreState> | null)[]) => {
  const changed = patches.filter((patch) => patch !== null);
  return changed.length ? (Object.assign({}, ...changed) as Partial<StoreState>) : null;
};

/**
 * Every slice's race runs after the view or the module on stage changes: `module`
 * gets `view`, the others none. Written once, so no module keeps a stale race.
 */
const racesFor = (state: StoreState, view: View, module: Module = state.module) =>
  merged(
    MODULES.map((m) => {
      const { forView } = loose[m];
      if (!forView) return null;
      return patchSlice(state, m, forView, { ...contextFor(state, m), view: m === module ? view : "single" });
    }),
  );

/** The inputs that no longer fit after the screen or a setting changed (see ModuleSlice.fit). */
const fitsFor = (state: StoreState, modules: Module[] = MODULES) =>
  merged(
    modules.map((m) => {
      const { fit } = loose[m];
      return fit ? patchSlice(state, m, fit) : null;
    }),
  );

const initialState = ({ url, isMobile, isPortrait }: StoreEnv) => {
  const view = url.view ?? "single";
  const speedPreset = url.speed ?? DEFAULT_PRESET;
  const shared = { isMobile, isPortrait, module: url.module, view, isModuleStart: url.isModuleStart, speedPreset };
  const modules = Object.fromEntries(
    MODULES.map((m) => {
      const ctx: SliceContext = { ...shared, view: m === url.module ? view : "single" };
      return [m, loose[m].hydrate(linkFor(url, m), ctx)];
    }),
  ) as SliceStates;
  return { ...shared, ...modules, isLanding: url.isLanding };
};

/** A store that opens on `env`. The app makes one, `useStore` in store.ts. */
export const createAppStore = (env: StoreEnv) => create<StoreState>((set, get) => {
  const initial = initialState(env);

  /**
   * The one way to put a new run on stage: playback starts over from the first
   * frame and any open guess-mode question goes with the old run. The patch may
   * set its own frameIndex and isPlaying; returning null changes nothing.
   */
  const replaceRun = (patch: (state: StoreState) => Partial<StoreState> | null) =>
    set((state) => {
      const next = patch(state);
      return next ? { frameIndex: 0, isPlaying: false, gameQuestion: null, ...next } : {};
    });

  /** A module's actions and settings, bound to this store. */
  const bind = (module: Module) => {
    const { actions, settings = {}, playFrom = {} } = loose[module];
    const boundActions = Object.entries(actions).map(([name, action]) => [
      name,
      (...args: unknown[]) =>
        replaceRun((state) => {
          const ctx = contextFor(state, module);
          const patch = patchSlice(state, module, (s) => action(s, ctx, ...args), ctx);
          const from = playFrom[name];
          if (!patch || !from) return patch;
          return { ...patch, frameIndex: from(patch[module] as object, ctx), isPlaying: true };
        }),
    ]);
    // Settings leave the run alone, so playback carries on, unless the input no longer fits.
    const boundSettings = Object.entries(settings).map(([name, setting]) => [
      name,
      (...args: unknown[]) => {
        set((state) => patchSlice(state, module, (s, ctx) => setting(s, ctx, ...args)) ?? {});
        replaceRun((state) => fitsFor(state, [module]));
      },
    ]);
    return Object.fromEntries([...boundActions, ...boundSettings]);
  };

  return {
    ...initial,
    frameIndex: 0,
    isPlaying: false,
    isScrubbing: false,
    isHelpOpen: false,
    theme: env.theme,

    // A first visit opens the tour of the module it lands on (not the race view, nor the landing page).
    isTourOpen: !tourDone(initial.module) && initial.view === "single" && !initial.isLanding,
    openTour: () => {
      // Each tour walks through the single view of its module.
      if (get().view === "race") get().setView("single");
      get().pause();
      set({ isTourOpen: true, isHelpOpen: false });
    },
    closeTour: () => {
      try {
        localStorage.setItem(slices[get().module].tourKey, "true");
      } catch {
        // Blocked storage: the tour may open again next visit.
      }
      set({ isTourOpen: false });
    },

    actions: Object.fromEntries(MODULES.map((m) => [m, bind(m)])) as SliceActions,

    pick: (module, algorithm) => {
      replaceRun((state) => {
        // Picking one algorithm leaves any race.
        const races = racesFor(state, "single", module);
        const ctx = { ...contextFor(state, module), view: "single" as const, isModuleStart: false };
        const pick = (s: object) => loose[module].pick(s, ctx, algorithm);
        const picked = patchSlice({ ...state, ...races }, module, pick, ctx);
        return { module, view: "single", isModuleStart: false, ...races, ...picked };
      });
    },

    raceWith: (module, racer) => {
      const { addRacer, current } = loose[module];
      if (get().module !== module) get().pick(module, current(get()[module]) as SliceAlgorithm<typeof module>);
      if (addRacer) set((state) => patchSlice(state, module, (s) => addRacer(s, racer)) ?? {});
      get().setView("race");
    },

    // Within the module on stage: its race runs on its own input.
    setView: (view) => {
      replaceRun((state) => ({ view, isModuleStart: false, ...racesFor(state, view) }));
    },

    createNewArray: () => {
      const { module } = get();
      replaceRun((state) => patchSlice(state, module, loose[module].newInput));
    },

    setTheme: (theme) => {
      document.documentElement.dataset.theme = theme;
      // The browser's toolbar takes the page background, read from the theme now that it's applied.
      const background = getComputedStyle(document.documentElement).getPropertyValue("--color-background").trim();
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", background);
      try {
        localStorage.setItem("theme", theme);
      } catch {
        // Private mode or blocked storage: the theme still applies for this visit.
      }
      set({ theme });
    },

    // After the screen changes shape, every input that no longer fits is replaced (e.g. rotating a tablet).
    setIsMobile: (isMobile) => {
      set({ isMobile });
      replaceRun((state) => fitsFor(state));
    },

    setIsPortrait: (isPortrait) => {
      set({ isPortrait });
      replaceRun((state) => fitsFor(state));
    },

    setSpeedPreset: (speedPreset) => set({ speedPreset }),
    setScrubbing: (isScrubbing) => set({ isScrubbing }),
    setHelpOpen: (isHelpOpen) => set({ isHelpOpen }),

    play: () =>
      set((state) => ({
        isPlaying: true,
        gameFeedback: null,
        // Replay from the start if the run already finished.
        frameIndex: state.frameIndex >= selectLastIndex(state) ? 0 : state.frameIndex,
      })),

    isGameOn: false,
    gameScore: NEW_SCORE,
    gameQuestion: null,
    gameFeedback: null,

    toggleGame: () =>
      set((state) => ({
        isGameOn: !state.isGameOn,
        gameQuestion: null,
        gameFeedback: null,
        // Turning it on stops playback, so the first question isn't missed mid-run.
        isPlaying: state.isGameOn ? state.isPlaying : false,
      })),

    answerGame: (answer) =>
      set((state) => {
        const q = state.gameQuestion;
        if (!q) return {};
        const right = answer === q.answer;
        markAnswered(q);
        const streak = right ? state.gameScore.streak + 1 : 0;
        return {
          gameQuestion: null,
          gameFeedback: { right, text: q.explain(right), id: Date.now(), question: q },
          gameScore: {
            asked: state.gameScore.asked + 1,
            right: state.gameScore.right + (right ? 1 : 0),
            streak,
            best: Math.max(state.gameScore.best, streak),
          },
          // Carry on, to show what happens.
          isPlaying: true,
        };
      }),

    resetGame: () =>
      set((state) => {
        const run = gameQuestionsOf(state)[0]?.run;
        if (run) forgetAnswers(run);
        return { gameScore: NEW_SCORE, gameQuestion: null, gameFeedback: null };
      }),

    pause: () => set({ isPlaying: false }),

    advanceBy: (steps) =>
      set((state) => {
        const lastIndex = selectLastIndex(state);
        const frameIndex = Math.min(state.frameIndex + steps, lastIndex);
        const ask = nextQuestion(state, frameIndex);
        // Playback holds just before it, still playing, until the explanation has had its time.
        if (ask && waitsForFeedback(state, ask)) return { frameIndex: ask.at - 1 };
        if (ask) return { frameIndex: ask.at - 1, isPlaying: false, gameQuestion: ask };
        return { frameIndex, isPlaying: frameIndex < lastIndex };
      }),

    stepForward: () =>
      set((state) => {
        const frameIndex = Math.min(state.frameIndex + 1, selectLastIndex(state));
        const ask = nextQuestion(state, frameIndex);
        if (ask) return { frameIndex: ask.at - 1, isPlaying: false, gameQuestion: ask };
        return { isPlaying: false, frameIndex };
      }),

    stepBackward: () =>
      set((state) => ({
        isPlaying: false,
        gameQuestion: null,
        frameIndex: Math.max(state.frameIndex - 1, 0),
      })),

    seek: (frameIndex) =>
      set((state) => ({
        frameIndex: Math.min(Math.max(frameIndex, 0), selectLastIndex(state)),
      })),
  };
});

export type AppStore = ReturnType<typeof createAppStore>;
