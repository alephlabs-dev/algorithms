import { describe, expect, it } from "vitest";
import { searchFor } from "@/navigation";
import { EXAMPLE_SPEED, defaultsOf, openLink, reopened, stateFor, within } from "@/modules/testing";
import { routePath } from "@/routes";
import { readLocation } from "@/urlState";
import { seededRandom } from "@/utils/random";
import { generateItems } from "./generateItems";
import { sortAlgorithms } from "./generators";
import { sortingLink } from "./link";
import { sortingManifest } from "./manifest";
import { sortingSlice } from "./slice";
import { Timeline } from "./timeline";

describe("sorting's link", () => {
  it("opens its example link with every setting the link carries", () => {
    // A slice that can't read a value falls back to its default without a word, and the shared tests would check the wrong state.
    expect(sortingManifest.example.search).toBe(
      sortingLink.write(
        { size: 40, inputOrder: "reversed", displayMode: "bars", seed: 12345, racers: ["insertion", "quick", "merge"] },
        EXAMPLE_SPEED,
      ),
    );
    expect(stateFor("sorting", "single", false).sorting).toMatchObject({
      algorithm: "heap",
      size: 40,
      inputOrder: "reversed",
      seed: 12345,
      racers: ["insertion", "quick", "merge"],
    });
  });

  it("puts every setting it shares in its link, so editing it changes the link", () => {
    const changes = [
      within("sorting", { size: 80 }),
      within("sorting", { inputOrder: "sorted" }),
      within("sorting", { seed: 99 }),
      within("sorting", { racers: ["quick", "merge"] }),
    ];
    for (const change of changes) {
      const state = stateFor("sorting", "single", false);
      expect(searchFor(change(state))).not.toBe(searchFor(state));
    }
  });

  it("has guess mode with 10 or 20 items, and none with more", () => {
    const sortingWith = (size: number) =>
      within("sorting", {
        algorithm: "insertion",
        size,
        run: new Timeline(sortAlgorithms.insertion, generateItems(size, "random", seededRandom(4))),
      })(stateFor("sorting", "single", false));
    const game = sortingSlice.engine.game;
    expect(game).toBeDefined();
    expect(game!(sortingWith(10).sorting).length).toBeGreaterThan(0);
    expect(game!(sortingWith(20).sorting).length).toBeGreaterThan(0);
    expect(game!(sortingWith(40).sorting)).toEqual([]);
    expect(game!(sortingWith(400).sorting)).toEqual([]);
  });

  describe("url state", () => {
    const sorting = {
      size: 100,
      inputOrder: "reversed",
      displayMode: "bars",
      seed: 123456789,
      racers: ["shell", "quick", "heap"],
    } as const;
    const search = sortingLink.write({ ...sorting, racers: [...sorting.racers] }, "2x");

    it("round-trips through the path and query string", () => {
      expect(readLocation(routePath({ module: "sorting", page: "algorithm", algorithm: "heap" }), search)).toEqual({
        isLanding: false,
        isModuleStart: false,
        module: "sorting",
        view: "single",
        speed: "2x",
        link: { algorithm: "heap", params: sorting },
      });
      // The race page has no algorithm of its own.
      expect(readLocation(routePath({ module: "sorting", page: "race" }), search)).toEqual({
        isLanding: false,
        isModuleStart: false,
        module: "sorting",
        view: "race",
        speed: "2x",
        link: { params: sorting },
      });
    });
  });
});

describe("sorting's captured links", () => {
  // Full links as the app wrote them before the link codecs moved into the modules (#128), opened on a
  // phone held upright: old shared links keep opening the same run.
  const links: [path: string, query: string][] = [
    ["/sorting/heap-sort", "?size=20&input=reversed&mode=bars&speed=2x&seed=1lka0qk&race=shell%2Cquick%2Cheap"],
    ["/sorting/race", "?size=10&input=fewUnique&mode=bars&seed=35afkg&race=insertion%2Cmerge"],
  ];

  it("round-trips a full link of every page kind it writes", () => {
    for (const [path, query] of links) expect(reopened(path, query), path + query).toBe(query);
  });

  it("falls back to the defaults on values it doesn't have", () => {
    const s = openLink("/sorting/heap-sort", "?size=37&input=shuffled&mode=dots&speed=4&seed=-1&race=quick");
    const d = defaultsOf("/sorting/heap-sort");
    expect(s.sorting).toMatchObject({ size: d.sorting.size, inputOrder: "random", displayMode: "bars", racers: d.sorting.racers });
    expect(s.speedPreset).toBe(d.speedPreset);
  });

  it("keeps racers unique and in order, and rejects too few or too many", () => {
    const racers = (race: string) => openLink("/sorting/race", `?race=${race}`).sorting.racers;
    const d = defaultsOf("/sorting/race").sorting.racers;
    expect(racers("merge,bubble,merge")).toEqual(["bubble", "merge"]);
    expect(racers("quick")).toEqual(d);
    expect(racers("selection,insertion,bubble,cocktail,shell")).toEqual(d);
    expect(racers("bfs,dfs")).toEqual(d);
  });
});
