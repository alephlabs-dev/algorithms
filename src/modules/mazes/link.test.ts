import { describe, expect, it } from "vitest";
import { engines } from "@/modules/engine";
import { EXAMPLE_SPEED, stateFor, within } from "@/modules/testing";
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
      expect(engines.mazes.search(change(state))).not.toBe(engines.mazes.search(state));
    }
  });
});
