import { describe, expect, it } from "vitest";
import { readUrlState, toSearch, type UrlState } from "./urlState";

describe("url state", () => {
  const state: UrlState = {
    algorithm: "heap",
    size: 100,
    inputOrder: "reversed",
    displayMode: "bars",
    speed: "2x",
    seed: 123456789,
    view: "race",
    raceAlgorithms: ["shell", "quick", "heap"],
  };

  it("round-trips through the query string", () => {
    expect(readUrlState(toSearch(state))).toEqual(state);
  });

  it("ignores unknown or malformed values", () => {
    expect(
      readUrlState("?algo=bogo&size=37&input=shuffled&mode=dots&speed=4&seed=-1&view=grid&race=quick")
    ).toEqual({});
  });

  it("keeps the valid values when some are wrong", () => {
    expect(readUrlState("?algo=quick&size=abc")).toEqual({ algorithm: "quick" });
  });
});
