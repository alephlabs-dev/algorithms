import { describe, expect, it } from "vitest";
import { engines } from "@/modules/engine";
import { EXAMPLE_SPEED, defaultsOf, openLink, reopened, stateFor, within } from "@/modules/testing";
import { readLocation } from "@/urlState";
import { dpLink } from "./link";
import { dpManifest } from "./manifest";
import { encodeItems } from "./presets";

describe("dynamic programming's link", () => {
  it("opens its example link with every setting the link carries", () => {
    const items = [
      { weight: 3, value: 4 },
      { weight: 4, value: 5 },
    ];
    expect(dpManifest.example.search).toBe(
      dpLink.write({ a: "KITTEN", b: "SITTING", items: encodeItems(items), capacity: 7 }, EXAMPLE_SPEED),
    );
    expect(stateFor("dp", "single", false).dp).toMatchObject({ algorithm: "lcs", a: "KITTEN", b: "SITTING", items, capacity: 7 });
  });

  it("puts every setting it shares in its link, so editing it changes the link", () => {
    const changes = [
      within("dp", { a: "SUNDAY" }),
      within("dp", { b: "SATURDAY" }),
      within("dp", { algorithm: "knapsack", capacity: 9 }),
    ];
    for (const change of changes) {
      const state = stateFor("dp", "single", false);
      expect(engines.dp.search(change(state))).not.toBe(engines.dp.search(state));
    }
  });

  describe("url state", () => {
    it("round-trips dynamic programming words with Ñ and accents through the link", () => {
      const words = (query: string) => readLocation("/dynamic-programming/edit-distance", query).link.params as { a?: string; b?: string };
      expect(words(dpLink.write({ a: "AÑO", b: "CAÑÓN" }, "1x"))).toMatchObject({ a: "AÑO", b: "CAÑÓN" });
      expect(words("?a=a%C3%B1o")).toMatchObject({ a: "AÑO" });
      expect(words("?a=A1").a).toBeUndefined();
    });
  });
});

describe("dynamic programming's captured links", () => {
  // Full links as the app wrote them before the link codecs moved into the modules (#128), opened on a
  // phone held upright: old shared links keep opening the same run.
  const links: [path: string, query: string][] = [
    ["/dynamic-programming/edit-distance", "?a=A%C3%91O&b=CA%C3%91%C3%93N&speed=2x"],
    ["/dynamic-programming/knapsack", "?items=1x1.3x4.4x5.5x7&cap=7&speed=2x"],
    ["/dynamic-programming/race", "?items=1x1.2x3.3x4&cap=5"],
  ];

  it("round-trips a full link of every page kind it writes", () => {
    for (const [path, query] of links) expect(reopened(path, query), path + query).toBe(query);
  });

  it("reads words in any case and falls back on words it can't use", () => {
    expect(openLink("/dynamic-programming/edit-distance", "?a=a%C3%B1o").dp.a).toBe("AÑO");
    const s = openLink("/dynamic-programming/knapsack", "?a=A1&items=***&cap=99");
    const d = defaultsOf("/dynamic-programming/knapsack");
    expect(s.dp).toMatchObject({ a: d.dp.a, items: d.dp.items, capacity: d.dp.capacity });
  });
});
