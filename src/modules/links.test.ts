/**
 * Each module's link, through its own code and no browser: the link is read, the module's state is
 * built from it, and the link is written back from that state (#128). Every module in the registry is
 * covered from its manifest's example link; links captured before #128 live in each module's link.test.ts.
 */
import { describe, expect, it } from "vitest";
import { MODULES, modulePages, routePath } from "@/routes";
import { engines } from "./engine";
import { reopened, stateFor } from "./testing";

describe.each(MODULES)("%s link", (module) => {
  it("round-trips its example link", () => {
    const state = stateFor(module, "single", false);
    const query = engines[module].search(state);
    expect(reopened(routePath(engines[module].route(state)), query, "desktop")).toBe(query);
  });

  if (!modulePages[module].race) return;
  it("round-trips its race link", () => {
    const state = stateFor(module, "race", false);
    const route = engines[module].route(state);
    expect(route.page).toBe("race");
    const query = engines[module].search(state);
    expect(reopened(routePath(route), query, "desktop")).toBe(query);
  });
});
