import { afterEach, describe, expect, it, vi } from "vitest";
import { LANGS } from "@/i18n";
import { allRoutes, modulePages } from "@/routes";

afterEach(() => {
  globalThis.__LANG__ = undefined;
  vi.resetModules();
});

const load = async (language: (typeof LANGS)[number]) => {
  globalThis.__LANG__ = language;
  vi.resetModules();
  return import("./scroll-hint");
};

describe.each(LANGS)("scroll hint in %s", (language) => {
  it("has a non-empty label on every route", async () => {
    const { hintLabel } = await load(language);
    for (const route of allRoutes) {
      expect(hintLabel(route).trim(), JSON.stringify(route)).not.toBe("");
    }
  });
});

it("has hints for every module in the route table", async () => {
  const { hintModules } = await load("en");
  expect(new Set(hintModules)).toEqual(new Set(Object.keys(modulePages)));
});
