/**
 * Characterization of today's store (#126): what a learner sees after switching
 * algorithm, module or view. It only goes through seams the per-module slices keep
 * (createAppStore, applyRoute, routeFor, searchFor, selectLastIndex, selectRaceRuns)
 * and asserts what reaches the screen or the link, never internal leftovers. The
 * slices refactor must pass it unchanged.
 */
import { describe, expect, it } from "vitest";
import { createAppStore, MAX_RACERS, MIN_RACERS, selectLastIndex, selectRaceRuns, type AppStore } from "@/appStore";
import { applyRoute, routeFor, searchFor } from "@/navigation";
import { href, moduleOf, type Route } from "@/routes";
import { readLocation } from "@/urlState";

const storeAt = (route: Route) =>
  createAppStore({ url: readLocation(href(route), ""), isMobile: false, isPortrait: false, theme: "dark" });

type Racing = { single: Route; other: Route; race: Route };

// The modules with a race view: an algorithm page, another algorithm of the same module, and the race.
const RACING: Racing[] = [
  {
    single: { kind: "algorithm", algorithm: "heap" },
    other: { kind: "algorithm", algorithm: "quick" },
    race: { kind: "race" },
  },
  {
    single: { kind: "path", algorithm: "bfs" },
    other: { kind: "path", algorithm: "astar" },
    race: { kind: "pathRace" },
  },
  {
    single: { kind: "graph", algorithm: "dfs" },
    other: { kind: "graph", algorithm: "prim" },
    race: { kind: "graphRace" },
  },
  {
    single: { kind: "structure", algorithm: "bst" },
    other: { kind: "structure", algorithm: "avl" },
    race: { kind: "structureRace" },
  },
  {
    single: { kind: "dpProblem", algorithm: "lcs" },
    other: { kind: "dpProblem", algorithm: "edit" },
    race: { kind: "dpRace" },
  },
];

// One algorithm page per module, races or not.
const PAGES: Route[] = [
  ...RACING.map((m) => m.single),
  { kind: "series", algorithm: "square" },
  { kind: "backtrackingProblem", algorithm: "queens" },
];

const lanes = (app: AppStore) => selectRaceRuns(app.getState());
const page = (app: AppStore) => href(routeFor(app.getState()));

/** Playback somewhere past the start, to see that a switch starts it over. */
const midway = (app: AppStore) => {
  const last = selectLastIndex(app.getState());
  app.getState().seek(Math.floor(last / 2));
};

const expectFreshPlayback = (app: AppStore) => {
  expect(app.getState().frameIndex).toBe(0);
  expect(app.getState().isPlaying).toBe(false);
};

/** A race shows one lane per racer: as many as its link names, when it names them. */
const expectRaceLanes = (app: AppStore) => {
  const count = lanes(app).length;
  expect(count).toBeGreaterThanOrEqual(MIN_RACERS);
  expect(count).toBeLessThanOrEqual(MAX_RACERS);
  const racers = new URLSearchParams(searchFor(app.getState())).get("race");
  if (racers) expect(count).toBe(racers.split(",").length);
  expect(selectLastIndex(app.getState())).toBeGreaterThan(0);
};

describe.each(RACING)("racing in $race.kind", ({ single, other, race }) => {
  it("opening the race shows its lanes on a fresh clock", () => {
    const app = storeAt(single);
    midway(app);
    applyRoute(app, race);
    expect(page(app)).toBe(href(race));
    expectRaceLanes(app);
    expectFreshPlayback(app);
  });

  it("a link to the race opens with its lanes", () => {
    expectRaceLanes(storeAt(race));
  });

  it("picking an algorithm leaves the race", () => {
    const app = storeAt(race);
    midway(app);
    applyRoute(app, single);
    expect(page(app)).toBe(href(single));
    expect(lanes(app)).toEqual([]);
    expectFreshPlayback(app);
  });

  it("switching algorithm keeps the input and starts playback over", () => {
    const app = storeAt(single);
    const link = searchFor(app.getState());
    midway(app);
    applyRoute(app, other);
    expect(page(app)).toBe(href(other));
    expect(searchFor(app.getState())).toBe(link);
    expect(lanes(app)).toEqual([]);
    expectFreshPlayback(app);
  });

  it.each(PAGES.filter((p) => moduleOf(p) !== moduleOf(race)).map((p) => [href(p), p] as const))(
    "leaving for %s shows no lanes, and coming back races again on the same input",
    (_, elsewhere) => {
      const app = storeAt(race);
      const link = searchFor(app.getState());
      const count = lanes(app).length;
      const last = selectLastIndex(app.getState());
      midway(app);

      applyRoute(app, elsewhere);
      expect(page(app)).toBe(href(elsewhere));
      expect(lanes(app)).toEqual([]);
      expectFreshPlayback(app);

      applyRoute(app, race);
      expect(page(app)).toBe(href(race));
      expect(searchFor(app.getState())).toBe(link);
      expect(lanes(app)).toHaveLength(count);
      expect(selectLastIndex(app.getState())).toBe(last);
      expectFreshPlayback(app);
    },
  );

  it.each(RACING.filter((m) => moduleOf(m.race) !== moduleOf(race)).map((m) => [href(m.race), m.race] as const))(
    "going straight to %s shows only that race's lanes",
    (_, otherRace) => {
      const app = storeAt(race);
      midway(app);
      applyRoute(app, otherRace);
      expect(page(app)).toBe(href(otherRace));
      expect(lanes(app)).toHaveLength(lanes(storeAt(otherRace)).length);
      expectRaceLanes(app);
      expectFreshPlayback(app);
    },
  );
});

describe.each(PAGES.map((p) => [href(p), p] as const))("on %s", (_, start) => {
  it.each(PAGES.filter((p) => moduleOf(p) !== moduleOf(start)).map((p) => [href(p), p] as const))(
    "switching to %s and back keeps the input",
    (_, elsewhere) => {
      const app = storeAt(start);
      const link = searchFor(app.getState());
      const last = selectLastIndex(app.getState());
      applyRoute(app, elsewhere);
      expect(page(app)).toBe(href(elsewhere));
      expect(lanes(app)).toEqual([]);
      applyRoute(app, start);
      expect(page(app)).toBe(href(start));
      expect(searchFor(app.getState())).toBe(link);
      expect(selectLastIndex(app.getState())).toBe(last);
      expectFreshPlayback(app);
    },
  );
});
