import type { ComponentType, ReactNode } from "react";
import type { StoreState, Theme } from "@/store";
import type { AlgorithmOf, ModuleId, RacingModule, Route } from "@/routes";

/** One algorithm in a module's pickers. */
export type AlgorithmChoice = { id: string; title: string; short: string };

/** Pickers list algorithms in groups; a group without a label is just a list. */
export type AlgorithmGroup = { label?: string; hint?: string; items: AlgorithmChoice[] };

/** One step of a module's guided tour. */
export type TourStep = {
  /** Matches `data-tour="…"` on the element to light up (the first visible one). */
  anchor: string;
  /** Where to point on phones when the anchor isn't on screen there (it lives in a sheet). */
  phoneAnchor?: string;
  title: string;
  text: (context: { theme: Theme; wide: boolean; phone: boolean }) => ReactNode;
  /** Brings the stage to a state the step can point at (a run partway through), when it shows. */
  prepare?: () => void;
};

type WithClass = { className?: string };

/**
 * Everything the shared interface (top bar, dock, code card, pickers, tour)
 * asks of a module. A new module fills this in, plus its engine, and the
 * rest of the app picks it up without knowing which module it is.
 */
export type ModuleUI = {
  id: ModuleId;
  title: string;

  /** The stage in single view. */
  Stage: ComponentType;
  /** Tools that sit above the stage from tablet width up (on phones they live in the settings). */
  Tools?: ComponentType<WithClass>;
  /** What the colors on stage mean. */
  Legend: ComponentType<WithClass>;
  /** Counters for the dock, in single view. */
  Stats: ComponentType<WithClass>;
  /** The settings, in the dock's popover and the phone's sheet. */
  Settings: ComponentType;
  /** Facts about the algorithm on stage, for its info popover (complexity, guarantees). */
  Facts: ComponentType;

  /** The settings in a few words: for the dock's pill and the phone's settings button. */
  settingsSummary: (s: StoreState) => { main: string; detail: string; mono?: boolean; label: string };
  /** How the timeline reads its position in single view, if not "step 12 / 340". */
  progress?: (index: number, last: number) => string;
  /** "New array", "New layout": what the dock's regenerate button makes. */
  newRunLabel: string;
  /**
   * When guess mode can't play the run on stage but a setting would let it, the button that
   * changes it in one tap ("Switch to the small grid"), turning guess mode on; null otherwise.
   */
  gameFix?: (s: StoreState) => { label: string; apply: () => void } | null;

  algorithms: AlgorithmGroup[];
  /** The algorithm on stage, by id. */
  current: (s: StoreState) => string;
  pick: (id: string) => void;

  /** About the algorithm on stage, for the info popover. */
  about: (s: StoreState) => { title: string; shortDescription: string; longDescription: string };
  /** One line next to the picker, e.g. "O(n log n) avg · O(n²) worst". */
  summary: (s: StoreState) => string;
  /** Racing several algorithms on the same input. Without it, the module has no race view. */
  race?: {
    /** The lanes. */
    Stage: ComponentType;
    racers: (s: StoreState) => string[];
    toggleRacer: (id: string) => void;
    /** Next to the racers picker, e.g. "Same array, same clock". */
    tagline: string;
    description: string;
    /** What one tick of the race clock counts. */
    unit: { one: string; short: string };
    /** A racer's short name, when the racers aren't the module's algorithms (the DP race's methods). */
    racerName?: (id: string) => string;
  };

  /** The pseudocode on stage, the line it's on, and the step into frame `index` in words. */
  code: {
    lines: (s: StoreState) => string[];
    line: (s: StoreState) => number | null;
    narrate: (s: StoreState, index: number) => string;
  };

  tour: TourStep[];
};

/** What an article gets: in the app, links switch pages without reloading; in static HTML they're plain links. */
export type Nav = { onNavigate?: (route: Route) => void };

/** A module's articles, one per page. A module with a race page needs a race article, or the typecheck fails. */
export type ModuleArticles<M extends ModuleId> = {
  start: ComponentType<Nav>;
  algorithm: ComponentType<Nav & { algorithm: AlgorithmOf<M> }>;
} & (M extends RacingModule ? { race: ComponentType<Nav> } : unknown);

/**
 * What the prerendered page shows of a module: its articles below the stage and
 * its landing thumbnail. The prerender renders it in Node, so it never reaches
 * the store or the module's interface and slice (lint rule house/module-boundaries).
 */
export type ModuleContent<M extends ModuleId> = {
  articles: ModuleArticles<M>;
  /** A small, still picture of the module for its landing card, drawn from a real run. */
  Thumbnail: ComponentType;
  /** A live demo for the landing page's hero. One module has it. */
  HeroDemo?: ComponentType;
};
