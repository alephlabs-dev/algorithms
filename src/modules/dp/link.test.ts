import { describe, expect, it } from "vitest";
import { engines } from "@/modules/engine";
import { EXAMPLE_SPEED, stateFor, within } from "@/modules/testing";
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
