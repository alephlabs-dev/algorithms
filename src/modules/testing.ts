// For tests: the store opened on each module's example link (its manifest's `example`).
import { expect } from "vitest";
import { createAppStore, type StoreState, type View } from "@/appStore";
import { moduleRoute, routePath } from "@/routes";
import { readLocation } from "@/urlState";
import type { ModuleId, SliceStates } from "./engine";
import { manifests } from "./manifests";

/** The speed every example link carries. */
export const EXAMPLE_SPEED = "2x";

/** The store opened on the module's example link, then switched to `view` the way the app does. */
export const stateFor = (module: ModuleId, view: View, isModuleStart: boolean): StoreState => {
  const { algorithm, search } = manifests[module].example;
  const store = createAppStore({
    url: readLocation(routePath(moduleRoute(module, "algorithm", algorithm)), search),
    isMobile: false,
    isPortrait: false,
    theme: "dark",
  });
  expect(store.getState().speedPreset).toBe(EXAMPLE_SPEED);
  if (view === "race") store.getState().setView("race");
  // Switching view leaves the module's start page, so the start page is set afterwards.
  return { ...store.getState(), isModuleStart };
};

/** A change to one module's slice. */
export const within =
  <M extends ModuleId>(module: M, change: Partial<SliceStates[M]>) =>
  (state: StoreState): StoreState => ({ ...state, [module]: { ...state[module], ...change } });
