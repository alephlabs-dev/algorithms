import { describe, expect, it } from "vitest";
import { MODULES, moduleOf, modulePages, routeFromPath, routePath } from "@/routes";
import { readLocation } from "@/urlState";
import { engines } from "./engine";
import { EXAMPLE_SPEED, stateFor } from "./testing";

// Each module opens on its manifest's example link: a page with settings that differ from its defaults.
// Each module's own link.test.ts checks that its slice reads every one of them.
describe("module engines", () => {
  for (const module of MODULES) {
    it(`${module}: every page it can be on belongs to it and survives its URL`, () => {
      for (const view of ["single", "race"] as const) {
        for (const isModuleStart of [false, true]) {
          const state = stateFor(module, view, isModuleStart);
          const route = engines[module].route(state);
          const path = routePath(route);
          expect(moduleOf(route)).toBe(module);
          expect(routeFromPath(path)).toEqual(route);
          const location = readLocation(path, engines[module].search(state));
          expect(location.module).toBe(module);
          // Modules without a race page are single view whatever the store's view says.
          expect(location.view ?? "single").toBe(modulePages[module].race ? view : "single");
          expect(location.speed).toBe(EXAMPLE_SPEED);
        }
      }
    });
  }
});
