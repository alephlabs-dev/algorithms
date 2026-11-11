import { describe, expect, it } from "vitest";
import { readLocation } from "./urlState";

// Each module's own link.test.ts checks how its pages and params read.
describe("url state", () => {
  it("treats / as the landing page unless an old link picked an algorithm", () => {
    expect(readLocation("/", "").isLanding).toBe(true);
    expect(readLocation("/", "?algo=quick")).toMatchObject({ link: { algorithm: "quick" }, isLanding: false });
  });

  it("opens each module's own page at its start", () => {
    expect(readLocation("/sorting", "")).toMatchObject({ isLanding: false, isModuleStart: true, module: "sorting" });
    expect(readLocation("/pathfinding", "")).toMatchObject({ isLanding: false, isModuleStart: true, module: "pathfinding" });
    expect(readLocation("/pathfinding/dijkstra", "").isModuleStart).toBe(false);
  });

  it("lets the path win over legacy query parameters", () => {
    expect(readLocation("/sorting/merge-sort", "?algo=quick&view=race")).toMatchObject({
      link: { algorithm: "merge" },
      view: "single",
    });
  });

  it("ignores unknown or malformed values", () => {
    const location = readLocation("/sorting", "?algo=bogo&size=37&input=shuffled&mode=dots&speed=4&seed=-1&view=grid&race=quick");
    expect(location.link).toEqual({ params: {} });
    expect(location.speed).toBeUndefined();
    expect(location.view).toBeUndefined();
  });

  it("moves links with a dropped speed preset to the nearest kept one", () => {
    const speed = (query: string) => readLocation("/sorting", query).speed;
    expect(speed("?speed=0.25x")).toBe("0.5x");
    expect(speed("?speed=16x")).toBe("8x");
    expect(speed("?speed=max")).toBe("8x");
    expect(speed("?speed=4x")).toBe("4x");
  });

  it("ignores a speed that was never a preset", () => {
    const speed = (query: string) => readLocation("/sorting", query).speed;
    expect(speed("?speed=3x")).toBeUndefined();
    expect(speed("?speed=constructor")).toBeUndefined();
    expect(speed("?speed=toString")).toBeUndefined();
  });

  it("keeps the valid values when some are wrong", () => {
    expect(readLocation("/sorting", "?algo=quick&size=abc").link).toEqual({ algorithm: "quick", params: {} });
  });

  it("only lets the open module read the query", () => {
    expect(readLocation("/pathfinding/dijkstra", "?size=10&seed=1&circles=25").link.params).toEqual({});
  });
});
