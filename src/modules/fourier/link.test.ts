import { describe, expect, it } from "vitest";
import type { StoreState } from "@/appStore";
import { engines } from "@/modules/engine";
import { EXAMPLE_SPEED, stateFor, within } from "@/modules/testing";
import { routePath } from "@/routes";
import { readLocation } from "@/urlState";
import { fourierLink } from "./link";
import { fourierManifest } from "./manifest";
import { encodePath, linkShape } from "./shapes";

describe("Fourier's link", () => {
  it("opens its example link with every setting the link carries", () => {
    // A drawing travels in its link as the slice keeps it: fitted by linkShape.
    const drawing = linkShape([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ]);
    expect(fourierManifest.example.search).toBe(
      fourierLink.write({ circles: 25, shape: "custom", path: encodePath(drawing) }, EXAMPLE_SPEED),
    );
    expect(stateFor("fourier", "single", false).fourier).toMatchObject({
      algorithm: "epicycles",
      circles: 25,
      shape: "custom",
      path: drawing,
    });
  });

  it("puts every setting it shares in its link, so editing it changes the link", () => {
    const changes = [
      within("fourier", { circles: 100 }),
      within("fourier", { shape: "star" }),
      within("fourier", {
        path: linkShape([
          { x: 0, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
        ]),
      }),
      (state: StoreState): StoreState => ({ ...state, speedPreset: "4x" }),
    ];
    for (const change of changes) {
      const state = stateFor("fourier", "single", false);
      expect(engines.fourier.search(change(state))).not.toBe(engines.fourier.search(state));
    }
  });

  describe("url state", () => {
    it("round-trips a Fourier page, with a hand-drawn shape", () => {
      const query = fourierLink.write({ circles: 25, shape: "custom", path: "AbC-_" }, "2x");
      expect(readLocation(routePath({ module: "fourier", page: "algorithm", algorithm: "epicycles" }), query)).toMatchObject({
        module: "fourier",
        speed: "2x",
        link: { algorithm: "epicycles", params: { circles: 25, shape: "custom", path: "AbC-_" } },
      });
      expect(readLocation("/fourier/square-wave", "?circles=999").link.params).toEqual({});
    });
  });
});
