import { describe, expect, it } from "vitest";
import { sizesFor } from "./sizesMap";

describe("array sizes on offer", () => {
  it("offers every size for bars on wide screens", () => {
    expect(sizesFor("bars", false)).toEqual([10, 20, 40, 100, 200, 400]);
  });

  it("stops at 200 bars on a phone", () => {
    expect(sizesFor("bars", true)).toEqual([10, 20, 40, 100, 200]);
  });

  it("fits 20 numbers on wide screens and 10 on a phone", () => {
    expect(sizesFor("numbers", false)).toEqual([10, 20]);
    expect(sizesFor("numbers", true)).toEqual([10]);
  });
});
