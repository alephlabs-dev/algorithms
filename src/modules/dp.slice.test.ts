import { describe, expect, it } from "vitest";
import { EXAMPLE_CAPACITY, EXAMPLE_ITEMS, methods, RACE_CAPACITY, RACE_ITEMS, wordPairs } from "@/dp";
import { routePath } from "@/routes";
import { routeIn } from "./engine";
import { linkFor, readLocation } from "@/urlState";
import { dpSlice as slice, type DpState } from "./dp.slice";
import type { SliceContext } from "./slice";

const single: SliceContext = {
  view: "single",
  isModuleStart: false,
  speedPreset: "1x",
  isMobile: false,
  isPortrait: false,
};
const race: SliceContext = { ...single, view: "race" };
const at = (path: string, search = "", ctx = single) => slice.hydrate(linkFor(readLocation(path, search), "dp"), ctx);
const apply = (s: DpState, patch: Partial<DpState> | null) => ({ ...s, ...patch });
const settings = ({ algorithm, a, b, items, capacity }: DpState) => ({ algorithm, a, b, items, capacity });
const BAG = [
  { weight: 2, value: 3 },
  { weight: 3, value: 4 },
  { weight: 4, value: 6 },
  { weight: 5, value: 7 },
  { weight: 1, value: 1 },
];

describe("dp slice", () => {
  it("opens on edit distance with the first word pair and the textbook bag", () => {
    const s = at("/dynamic-programming");
    expect(settings(s)).toEqual({
      algorithm: "edit",
      a: wordPairs[0].a,
      b: wordPairs[0].b,
      items: EXAMPLE_ITEMS,
      capacity: EXAMPLE_CAPACITY,
    });
    expect(s.raceRuns).toEqual([]);
  });

  it("a race link opens on the race's own example, one run per method", () => {
    const s = at("/dynamic-programming/race", "", race);
    expect([s.items, s.capacity]).toEqual([RACE_ITEMS, RACE_CAPACITY]);
    expect(s.raceRuns).toHaveLength(methods.length);
  });

  it("survives its own link: words for the word problems, the bag for knapsack and the race", () => {
    const edit = at("/dynamic-programming");
    const words = apply(edit, slice.actions.setWords(edit, single, "SUNDAY", "SATURDAY"));
    const knapsack = at("/dynamic-programming/knapsack");
    const bag = apply(knapsack, slice.actions.setItems(knapsack, single, BAG, 9));
    for (const s of [words, bag]) {
      const reopened = at(routePath(routeIn("dp", slice.current(s), single)), slice.engine.search(s, single));
      expect(reopened.algorithm).toBe(s.algorithm);
      const carried = (x: DpState) => (x.algorithm === "knapsack" ? [x.items, x.capacity] : [x.a, x.b]);
      expect(carried(reopened)).toEqual(carried(s));
    }
  });

  it("entering the race from the textbook bag swaps to the race's example; a bag of your own stays", () => {
    const textbook = at("/dynamic-programming/knapsack");
    const racing = apply(textbook, slice.forView!(textbook, race));
    expect([racing.items, racing.capacity]).toEqual([RACE_ITEMS, RACE_CAPACITY]);
    expect(racing.raceRuns).toHaveLength(methods.length);

    const own = apply(textbook, slice.actions.setItems(textbook, single, BAG, 9));
    const ownRacing = apply(own, slice.forView!(own, race));
    expect([ownRacing.items, ownRacing.capacity]).toEqual([BAG, 9]);
    expect(apply(ownRacing, slice.forView!(ownRacing, single)).raceRuns).toEqual([]);
  });

  it("new input: the next word pair, or a new bag for the same capacity", () => {
    const words = at("/dynamic-programming");
    const next = apply(words, slice.newInput(words, single));
    expect([next.a, next.b]).toEqual([wordPairs[1].a, wordPairs[1].b]);

    const knapsack = at("/dynamic-programming/knapsack");
    const renewed = apply(knapsack, slice.newInput(knapsack, single));
    expect(renewed.capacity).toBe(knapsack.capacity);
    expect(renewed.items.length).toBeGreaterThanOrEqual(4);
    expect(renewed.run).not.toBe(knapsack.run);
  });
});
