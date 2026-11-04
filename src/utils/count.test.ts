import { describe, expect, it } from "vitest";
import { count } from "./count";

describe("count", () => {
  it("uses the singular only for one", () => {
    expect(count(0, "swap")).toBe("0 swaps");
    expect(count(1, "comparison")).toBe("1 comparison");
    expect(count(1024, "step")).toBe("1,024 steps");
  });
});
