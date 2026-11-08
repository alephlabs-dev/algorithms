import type { View } from "@/appStore";
import { sortAlgorithms, Timeline } from "@/algorithms";
import { sizes, sizesFor } from "@/consts/sizesMap";
import { questionsOf, SORT_GUESS_MAX_SIZE, sortQuestions } from "@/game";
import { localized } from "@/i18n";
import type { Algorithm, DisplayMode, InputOrder, Size } from "@/types";
import { toSearch } from "@/urlState";
import { generateItems } from "@/utils/generateItems";
import { newSeed, seededRandom } from "@/utils/random";
import { STEP_WEIGHT } from "@/utils/speed";
import { defineModule, toggleRacer, withRacer, type SliceContext } from "./slice";

export type SortingState = {
  algorithm: Algorithm;
  /** How many items the array has. */
  size: number;
  displayMode: DisplayMode;
  /** How the generated array starts out (random, reversed...). */
  inputOrder: InputOrder;
  /** Seeds the current array, so a link can reproduce it exactly. */
  seed: number;
  /** The whole run, precomputed. Frame 0 is the unsorted array. */
  run: Timeline;
  /** Algorithms racing on the array, in the sidebar's order. */
  racers: Algorithm[];
  /** One run per racer, on the same array as `run`. Empty outside race view. */
  raceRuns: Timeline[];
  /** Bumped on every new array so bars remount instead of animating. */
  inputId: number;
};

// In sidebar order, like any selection the user makes.
const DEFAULT_RACERS: Algorithm[] = ["insertion", "bubble", "quick", "merge"];
const ORDER = Object.keys(sortAlgorithms) as Algorithm[];

const runFor = (algorithm: Algorithm, items: readonly number[]) => new Timeline(sortAlgorithms[algorithm], items);

const itemsFor = (size: number, order: InputOrder, seed: number) => generateItems(size, order, seededRandom(seed));

const raceRunsFor = (view: View, racers: Algorithm[], items: readonly number[]) =>
  view === "race" ? racers.map((a) => runFor(a, items)) : [];

/** The biggest size on offer (see sizesFor). */
const maxSizeFor = (displayMode: DisplayMode, isMobile: boolean) => {
  const offered = sizesFor(displayMode, isMobile);
  return offered[offered.length - 1];
};

/** A new array of `size` items in the slice's order, and every run on it. */
const fresh = (s: SortingState, ctx: SliceContext, size: number, inputOrder = s.inputOrder) => {
  const seed = newSeed();
  const items = itemsFor(size, inputOrder, seed);
  return {
    size,
    inputOrder,
    seed,
    inputId: s.inputId + 1,
    run: runFor(s.algorithm, items),
    raceRuns: raceRunsFor(ctx.view, s.racers, items),
  };
};

/**
 * The sizes Guess plays with in sorting, in words ("10 or 20"); the tour says them too.
 * Bigger arrays have bars too thin to follow and too many moments to stop at.
 */
const guessText = localized({
  en: { or: " or ", unavailable: (sizes: string) => `Guess works with ${sizes} items` },
  es: { or: " o ", unavailable: (sizes) => `Adivina funciona con ${sizes} elementos` },
});
export const sortGuessSizes = sizes.filter((size) => size <= SORT_GUESS_MAX_SIZE).join(guessText.or);
const guessUnavailable = (s: SortingState) =>
  s.size <= SORT_GUESS_MAX_SIZE ? null : guessText.unavailable(sortGuessSizes);

export const sortingSlice = defineModule<SortingState, Algorithm>()({
  // The first module's key, from before every module had a tour.
  tourKey: "tour-done",

  hydrate: (link, ctx) => {
    const displayMode = link.displayMode ?? "bars";
    const size = Math.min(link.size ?? (ctx.isMobile ? 20 : 40), maxSizeFor(displayMode, ctx.isMobile));
    const inputOrder = link.inputOrder ?? "random";
    const seed = link.seed ?? newSeed();
    const algorithm = link.algorithm ?? "selection";
    const racers = link.raceAlgorithms ?? DEFAULT_RACERS;
    const items = itemsFor(size, inputOrder, seed);
    return {
      algorithm,
      size,
      displayMode,
      inputOrder,
      seed,
      run: runFor(algorithm, items),
      racers,
      raceRuns: raceRunsFor(ctx.view, racers, items),
      inputId: 0,
    };
  },

  current: (s) => s.algorithm,

  // Keeps the same array so algorithms can be compared on identical data.
  pick: (s, _, algorithm) => ({ algorithm, run: runFor(algorithm, s.run.values) }),

  actions: {
    setSize: (s, ctx, size: number) => fresh(s, ctx, size),
    setInputOrder: (s, ctx, inputOrder: InputOrder) => fresh(s, ctx, s.size, inputOrder),
    toggleRacer: (s, ctx, racer: Algorithm) => {
      const racers = toggleRacer(ORDER, s.racers, racer);
      return racers && { racers, raceRuns: raceRunsFor(ctx.view, racers, s.run.values) };
    },
  },

  settings: {
    setDisplayMode: (_s: SortingState, _: SliceContext, displayMode: DisplayMode) => ({ displayMode }),
  },

  addRacer: (s, racer) => ({ racers: withRacer(ORDER, s.racers, racer) }),

  forView: (s, ctx) => ({ raceRuns: raceRunsFor(ctx.view, s.racers, s.run.values) }),

  // Shrinks the array if the screen or the display mode got too small for it (e.g. rotating a tablet).
  fit: (s, ctx) => {
    const maxSize = maxSizeFor(s.displayMode, ctx.isMobile);
    return s.size > maxSize ? fresh(s, ctx, maxSize) : null;
  },

  newInput: (s, ctx) => fresh(s, ctx, s.size),

  engine: {
    lastIndex: (s, view) => (view === "race" ? Math.max(0, ...s.raceRuns.map((t) => t.totalOps)) : s.run.length - 1),
    stepWeight: (s, index) => STEP_WEIGHT[s.run.kindAt(index) ?? "finish"],
    pace: (view) => view,
    route: (s, ctx) => {
      if (ctx.view === "race") return { kind: "race" };
      return ctx.isModuleStart ? { kind: "sorting" } : { kind: "algorithm", algorithm: s.algorithm };
    },
    search: (s, ctx) =>
      toSearch({
        // The slice only ever holds sizes from the sizes list.
        size: s.size as Size,
        inputOrder: s.inputOrder,
        displayMode: s.displayMode,
        speed: ctx.speedPreset,
        seed: s.seed,
        raceAlgorithms: s.racers,
      }),
    game: (s) => (guessUnavailable(s) ? [] : questionsOf(s.run, (run) => sortQuestions(run, s.algorithm))),
    gameUnavailable: guessUnavailable,
  },
});
