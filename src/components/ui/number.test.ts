import { describe, expect, it } from "vitest";
import { parseWholeNumber } from "./number";

describe("parseWholeNumber", () => {
  it("reads a whole number in range", () => {
    expect(parseWholeNumber("42", 1, 99)).toBe(42);
    expect(parseWholeNumber(" 7 ", 1, 99)).toBe(7);
  });

  it("accepts both ends of the range", () => {
    expect(parseWholeNumber("1", 1, 99)).toBe(1);
    expect(parseWholeNumber("99", 1, 99)).toBe(99);
  });

  it("rejects numbers out of range", () => {
    expect(parseWholeNumber("0", 1, 99)).toBeNull();
    expect(parseWholeNumber("100", 1, 99)).toBeNull();
  });

  it("rejects anything that isn't digits only", () => {
    for (const text of ["", "  ", "abc", "4a", "-5", "+5", "4.5", "1e2", "0x1f", "４２"]) {
      expect(parseWholeNumber(text, 0, 99), JSON.stringify(text)).toBeNull();
    }
  });
});
