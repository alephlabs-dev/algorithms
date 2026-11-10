import { describe, expect, it } from "vitest";
import { renderPage } from "@/seo/render";
import template from "../../../index.html?raw";
import { sortingAlgorithms } from "./algorithms";

/** React escapes these in text; the rest of a description comes out as written. */
const escaped = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;");

describe("a sorting page, prerendered", () => {
  const html = renderPage(template, { module: "sorting", page: "algorithm", algorithm: "insertion" });

  it("prerenders the explanation closed, with its text still in the page", () => {
    const details = html.match(/<details data-disclosure="[^"]*"[^>]*>([\s\S]*?)<\/details>/);
    expect(details, "a disclosure").not.toBeNull();
    expect(details![0], "closed: no open attribute").not.toMatch(/<details[^>]*\sopen/);
    const summary = details![1].match(/<summary[^>]*><h2[^>]*>(.*?)<\/h2>/);
    expect(summary, "a summary holding the heading").not.toBeNull();
    expect(summary![1]).toContain("How Insertion Sort works");
    expect(details![1]).toContain(escaped(sortingAlgorithms.insertion.longDescription));
  });
});
