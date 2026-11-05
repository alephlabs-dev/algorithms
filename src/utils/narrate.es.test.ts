import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// The language is fixed when the modules load, so load them again as a Spanish page would.
describe("narrate in Spanish", () => {
  let narrate: typeof import("./narrate").narrate;
  let algorithms: typeof import("@/algorithms");

  beforeAll(async () => {
    vi.stubGlobal("__LANG__", "es");
    vi.resetModules();
    ({ narrate } = await import("./narrate"));
    algorithms = await import("@/algorithms");
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("speaks Spanish from the first step to the last", () => {
    const timeline = new algorithms.Timeline(algorithms.sortAlgorithms.quick, [3, 1, 2]);
    const sentences = Array.from({ length: timeline.length }, (_, i) => narrate(timeline, i, algorithms.pseudocode.quick));
    expect(sentences[0]).toMatch(/Presiona play/);
    expect(sentences).toContain("Elige 2 como pivote.");
    expect(sentences[sentences.length - 1]).toMatch(/^¡Ordenado!/);
  });
});
