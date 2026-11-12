import { describe, expect, it } from "vitest";
import { searchFor } from "@/navigation";
import { EXAMPLE_SPEED, defaultsOf, openLink, reopened, stateFor, within } from "@/modules/testing";
import { mazesLink } from "./link";
import { mazesManifest } from "./manifest";

describe("mazes' link", () => {
  it("opens its example link with every setting the link carries", () => {
    expect(mazesManifest.example.search).toBe(
      mazesLink.write({ size: "large", seed: 424242, racers: ["prim", "wilson"] }, EXAMPLE_SPEED),
    );
    expect(stateFor("mazes", "single", false).mazes).toMatchObject({
      algorithm: "dfs",
      size: "large",
      seed: 424242,
      racers: ["prim", "wilson"],
    });
  });

  it("puts every setting it shares in its link, so editing it changes the link", () => {
    const changes = [
      within("mazes", { size: "small" }),
      within("mazes", { seed: 7 }),
      within("mazes", { racers: ["dfs", "kruskal"] }),
    ];
    for (const change of changes) {
      const state = stateFor("mazes", "single", false);
      expect(searchFor(change(state))).not.toBe(searchFor(state));
    }
  });
});

describe("mazes' captured links", () => {
  // Full links as the app wrote them before the link codecs moved into the modules (#128), opened on a
  // phone held upright: old shared links keep opening the same run.
  const links: [path: string, query: string][] = [
    ["/mazes/dfs", "?size=large&seed=1lka0qk&speed=2x"],
    ["/mazes/dfs", "?size=small&seed=0"],
    ["/mazes/wilson", "?size=large&seed=1lka0qk&race=prim%2Cwilson&speed=2x"],
    // Phones race small mazes.
    ["/mazes/race", "?size=small&seed=35afkg&race=dfs%2Ckruskal%2Cwilson"],
  ];

  it("round-trips a full link of every page kind it writes", () => {
    for (const [path, query] of links) expect(reopened(path, query), path + query).toBe(query);
  });

  it("falls back to the defaults on values it doesn't have, with a fresh seed", () => {
    const s = openLink("/mazes/dfs", "?size=huge&seed=***");
    expect(s.mazes.size).toBe(defaultsOf("/mazes/dfs").mazes.size);
    expect(searchFor(s)).toMatch(/^\?size=small&seed=[0-9a-z]+$/);
  });
});
