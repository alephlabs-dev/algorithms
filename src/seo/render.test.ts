import { describe, expect, it } from "vitest";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { renderPage } from "./render";
import template from "../../index.html?raw";

/** React escapes these in text; the rest of a description comes out as written. */
const escaped = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;");

describe("renderPage", () => {
  const html = renderPage(template, { module: "sorting", page: "algorithm", algorithm: "insertion" });

  it("prerenders the explanation closed, with its text still in the page", () => {
    const trigger = html.match(/<h2[^>]*><button[^>]*aria-expanded="false"[^>]*aria-controls="([^"]+)"[^>]*>(.*?)<\/button><\/h2>/);
    expect(trigger, "a heading wrapping a closed disclosure button").not.toBeNull();
    const [, panelId, label] = trigger!;
    expect(label).toContain("How Insertion Sort works");

    const panel = html.match(new RegExp(`<div[^>]*id="${panelId}"[^>]*>`));
    expect(panel, "the panel the button controls").not.toBeNull();
    expect(panel![0]).toContain("hidden");
    expect(html.slice(html.indexOf(panel![0]))).toContain(escaped(sortingAlgorithms.insertion.longDescription));
  });

  it("keeps the summary table open", () => {
    expect(html).toMatch(/<h2[^>]*>Time and space complexity<\/h2>/);
  });
});
