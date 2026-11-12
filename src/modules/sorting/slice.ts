import type { View } from "@/appStore";
import { SORT_ALGORITHMS, sortAlgorithms } from "./generators";
import { Timeline, type StepKind } from "./timeline";
import { sizes, sizesFor } from "./sizesMap";
import { questionsOf } from "@/game";
import { sortQuestions } from "./questions";
import { localized } from "@/i18n";
import type { Algorithm, DisplayMode, InputOrder, Size } from "./types";
import { sortingLink, type SortingLink } from "./link";
import { generateItems } from "./generateItems";
import { newSeed, seededRandom } from "@/utils/random";
import { defineModule, toggleRacer, withRacer, type SliceContext } from "@/modules/slice";
import { sentences } from "./sentences";

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

/**
 * Share of a full step each kind of step takes during playback. Moves get the
 * full beat, comparisons a shorter one, and steps that only move the
 * pseudocode line pass instantly, so the rhythm reads "look, move" instead of
 * an even tick with pauses where nothing happens.
 */
const STEP_WEIGHT: Record<StepKind, number> = {
  swap: 1,
  move: 1,
  finish: 1,
  compare: 0.6,
  highlight: 0.5,
  done: 0.4,
  line: 0,
};

// In sidebar order, like any selection the user makes.
const DEFAULT_RACERS: Algorithm[] = ["insertion", "bubble", "quick", "merge"];

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

/** Sorting plays guess mode with this many items at most. */
export const SORT_GUESS_MAX_SIZE = 20;

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

export const sortingSlice = defineModule<SortingState, Algorithm, SortingLink>()({
  sentences,
  link: sortingLink,
  hydrate: (link, ctx) => {
    const displayMode = link.params.displayMode ?? "bars";
    const size = Math.min(link.params.size ?? (ctx.isMobile ? 20 : 40), maxSizeFor(displayMode, ctx.isMobile));
    const inputOrder = link.params.inputOrder ?? "random";
    const seed = link.params.seed ?? newSeed();
    const algorithm = link.algorithm ?? "selection";
    const racers = link.params.racers ?? DEFAULT_RACERS;
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
      const racers = toggleRacer(SORT_ALGORITHMS, s.racers, racer);
      return racers && { racers, raceRuns: raceRunsFor(ctx.view, racers, s.run.values) };
    },
  },

  settings: {
    setDisplayMode: (_s: SortingState, _: SliceContext, displayMode: DisplayMode) => ({ displayMode }),
  },

  addRacer: (s, racer) => ({ racers: withRacer(SORT_ALGORITHMS, s.racers, racer) }),

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
    pace: (view) => (view === "race" ? 30 : 240),
    search: (s, ctx) =>
      sortingLink.write(
        // The slice only ever holds sizes from the sizes list.
        { size: s.size as Size, inputOrder: s.inputOrder, displayMode: s.displayMode, seed: s.seed, racers: s.racers },
        ctx.speedPreset,
      ),
    game: (s) => (guessUnavailable(s) ? [] : questionsOf(s.run, (run) => sortQuestions(run, s.algorithm))),
    gameUnavailable: guessUnavailable,
  },
});
