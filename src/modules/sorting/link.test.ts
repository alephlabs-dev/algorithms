import { describe, expect, it } from "vitest";
import { engines } from "@/modules/engine";
import { EXAMPLE_SPEED, stateFor, within } from "@/modules/testing";
import { routePath } from "@/routes";
import { readLocation } from "@/urlState";
import { seededRandom } from "@/utils/random";
import { generateItems } from "./generateItems";
import { sortAlgorithms } from "./generators";
import { sortingLink } from "./link";
import { sortingManifest } from "./manifest";
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
      expect(engines.sorting.search(change(state))).not.toBe(engines.sorting.search(state));
    }
  });

  it("has guess mode with 10 or 20 items, and none with more", () => {
    const sortingWith = (size: number) =>
      within("sorting", {
        algorithm: "insertion",
        size,
        run: new Timeline(sortAlgorithms.insertion, generateItems(size, "random", seededRandom(4))),
      })(stateFor("sorting", "single", false));
    const game = engines.sorting.game;
    expect(game).toBeDefined();
    expect(game!(sortingWith(10)).length).toBeGreaterThan(0);
    expect(game!(sortingWith(20)).length).toBeGreaterThan(0);
    expect(game!(sortingWith(40))).toEqual([]);
    expect(game!(sortingWith(400))).toEqual([]);
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
