import type { LinkCodec } from "./link";
import type { View } from "@/appStore";
import type { Question } from "@/game";
import type { Pace, SpeedPreset } from "@/utils/speed";

/**
 * A module's part of the link the app opened on: the algorithm its page names (none on
 * the start or race page), and the params its own codec read from the query (./<id>.link.ts).
 * A module that isn't open gets no algorithm and empty params.
 */
export type Link<P = object, Id extends string = string> = { algorithm?: Id; params: P };

/** What a slice reads from the shared store. It never writes it. */
export type SliceContext = {
  /** This module's view: the shared one while it's on stage, single otherwise. */
  view: View;
  isModuleStart: boolean;
  speedPreset: SpeedPreset;
  isMobile: boolean;
  isPortrait: boolean;
};

/** A change to a slice; null changes nothing. */
export type Patch<S> = Partial<S> | null;

/** A module action: a pure change to its own slice. The store binds it, so callers pass only the arguments. */
type Action<S> = (slice: S, ctx: SliceContext, ...args: never[]) => Patch<S>;

/**
 * One module's state and behavior, without React or `window`. The store holds one
 * slice per module under its id, and only the store writes: every action here
 * returns a patch, and any patch that changes the run starts playback over.
 */
export type ModuleSlice<
  S,
  Id extends string,
  P extends object,
  A extends Record<string, Action<S>>,
  B extends Record<string, Action<S>> = Record<never, never>,
> = {
  /** Remembers that the module's tour was seen (in localStorage). */
  tourKey: string;
  /** Reads and writes the module's own params in a link (see ./link.ts). */
  link: LinkCodec<P>;
  /** The slice a visit starts with, from the link (checked against the module's state, with defaults) and the screen. */
  hydrate: (link: Link<P, Id>, ctx: SliceContext) => S;
  /** The algorithm on stage (in backtracking, the problem). */
  current: (slice: S) => Id;
  /** Puts an algorithm on stage, in single view. */
  pick: (slice: S, ctx: SliceContext, id: Id) => Partial<S>;
  /** Changes to the module's input or settings; each one replaces the run, stopped at its first frame. */
  actions: A;
  /** Changes to tools that leave the run alone (what dragging paints), so playback carries on. */
  settings?: B;
  /** Actions after which playback runs on its own, from the frame given here (on the slice after the action). */
  playFrom?: { [K in keyof A]?: (slice: S, ctx: SliceContext) => number };
  /**
   * The race runs for `ctx.view`: one per racer in race view, none in single view.
   * The store calls it whenever the view or the module on stage changes. Without it, the module has no race.
   */
  forView?: (slice: S, ctx: SliceContext) => Partial<S>;
  /** Adds a racer before switching to race view ("race it"): the race's racers, with `racer` among them. */
  addRacer?: (slice: S, racer: Id) => Partial<S>;
  /**
   * After the screen or one of the module's settings changes: an input that fits
   * (an upright layout on a narrow screen, fewer items on a small one), or null when it already does.
   */
  fit?: (slice: S, ctx: SliceContext) => Patch<S>;
  /** "New": another input of the same kind. */
  newInput: (slice: S, ctx: SliceContext) => Patch<S>;
  /** What playback needs: how long a run is and how its steps are paced, and the query string of its link. */
  engine: {
    /** The last playback position: a frame index in single view, the race clock in race view. */
    lastIndex: (slice: S, view: View) => number;
    /** Share of a beat the step into frame `index` takes in single view (races tick evenly). */
    stepWeight: (slice: S, index: number) => number;
    /** Which target pace 1× is tuned to (see utils/speed). */
    pace: (view: View) => Pace;
    /** The query string that reproduces the run, written with `link.write`. */
    search: (slice: S, ctx: SliceContext) => string;
    /** Guess mode: the questions for the run on stage, in frame order. Without it, the module has no guess mode. */
    game?: (slice: S) => Question[];
    /** Why guess mode can't play the run on stage, shown on its toggle; null when it can. */
    gameUnavailable?: (slice: S) => string | null;
  };
};

/** Declares a module's slice: `defineModule<State, AlgorithmId, LinkParams>()({ ... })`. */
export const defineModule =
  <S, Id extends string, P extends object>() =>
  <A extends Record<string, Action<S>>, B extends Record<string, Action<S>> = Record<never, never>>(
    slice: ModuleSlice<S, Id, P, A, B>,
  ) =>
    slice;

/** A module's actions as callers see them: the arguments only, the store applies the patch. */
export type Bound<A> = {
  [K in keyof A]: A[K] extends (slice: never, ctx: never, ...args: infer P) => unknown ? (...args: P) => void : never;
};

/** Every action a module's callers can call: its actions and its settings. */
export type BoundSlice<T extends { actions: unknown; settings?: unknown }> = Bound<T["actions"]> &
  Bound<NonNullable<T["settings"]>>;

export const MIN_RACERS = 2;
export const MAX_RACERS = 4;

/**
 * The racers after tapping `racer`: added or taken out, in `order`. Null when that
 * would leave fewer than MIN_RACERS or more than MAX_RACERS.
 */
export const toggleRacer = <T extends string>(order: readonly T[], racers: readonly T[], racer: T): T[] | null => {
  const selected = racers.includes(racer);
  if ((selected && racers.length <= MIN_RACERS) || (!selected && racers.length >= MAX_RACERS)) return null;
  return order.filter((a) => (a === racer ? !selected : racers.includes(a)));
};

/** Phones, and any window taller than wide, get upright grids and graphs that fit their stage. */
export const isNarrow = (s: { isMobile: boolean; isPortrait: boolean }) => s.isMobile || s.isPortrait;

/** The racers with `racer` among them, in `order`; a full race gives up its last racer for it. */
export const withRacer = <T extends string>(order: readonly T[], racers: readonly T[], racer: T): T[] => {
  if (racers.includes(racer)) return [...racers];
  const kept = racers.length >= MAX_RACERS ? racers.slice(0, -1) : racers;
  return order.filter((a) => a === racer || kept.includes(a));
};
