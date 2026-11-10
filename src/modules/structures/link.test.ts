import { describe, expect, it } from "vitest";
import { engines } from "@/modules/engine";
import { EXAMPLE_SPEED, stateFor, within } from "@/modules/testing";
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
