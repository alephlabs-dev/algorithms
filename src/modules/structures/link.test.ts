import { describe, expect, it } from "vitest";
import { engines } from "@/modules/engine";
import { EXAMPLE_SPEED, defaultsOf, openLink, reopened, stateFor, within } from "@/modules/testing";
import { structuresLink } from "./link";
import { structuresManifest } from "./manifest";
import { encodeOperations } from "./operations";

describe("data structures' link", () => {
  it("opens its example link with every setting the link carries", () => {
    const ops = [
      { kind: "insert", value: 10 },
      { kind: "insert", value: 20 },
    ] as const;
    expect(structuresManifest.example.search).toBe(
      structuresLink.write({ ops: encodeOperations([...ops]), size: "medium", preset: "ascending" }, EXAMPLE_SPEED),
    );
    expect(stateFor("structures", "single", false).structures).toMatchObject({
      algorithm: "avl",
      ops: [...ops],
      size: "medium",
      preset: "ascending",
    });
  });

  it("puts every setting it shares in its link, so editing it changes the link", () => {
    const changes = [
      within("structures", {
        ops: [
          { kind: "insert", value: 10 },
          { kind: "delete", value: 10 },
        ],
      }),
      within("structures", { preset: "random" }),
    ];
    for (const change of changes) {
      const state = stateFor("structures", "single", false);
      expect(engines.structures.search(change(state))).not.toBe(engines.structures.search(state));
    }
  });
});

describe("data structures' captured links", () => {
  // Full links as the app wrote them before the link codecs moved into the modules (#128), opened on a
  // phone held upright: old shared links keep opening the same run.
  const links: [path: string, query: string][] = [
    ["/structures/avl-tree", "?ops=i50.i30.i20.i70.i80.i75.i40&values=large&order=ascending&speed=2x"],
    ["/structures/race", "?ops=i50.i30.i20.i70.i80.i75.i40&values=small&order=example"],
  ];

  it("round-trips a full link of every page kind it writes", () => {
    for (const [path, query] of links) expect(reopened(path, query), path + query).toBe(query);
  });

  it("falls back to the defaults on values it doesn't have", () => {
    const s = openLink("/structures/avl-tree", "?ops=x1&values=huge&order=shuffled");
    expect(s.structures).toMatchObject({ size: defaultsOf("/structures/avl-tree").structures.size, preset: "example" });
  });
});
