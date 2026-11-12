// For tests: the store opened on each module's example link (its manifest's `example`).
import { expect } from "vitest";
import { createAppStore, type StoreState, type View } from "@/appStore";
import { searchFor } from "@/navigation";
import { moduleRoute, routePath, type ModuleId } from "@/routes";
import { readLocation } from "@/urlState";
import type { SliceStates } from "./engine";
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
  if (view !== "single") store.getState().setView(view);
  // Switching view leaves the module's start page, so the start page is set afterwards.
  return { ...store.getState(), isModuleStart };
};

/** A change to one module's slice. */
export const within =
  <M extends ModuleId>(module: M, change: Partial<SliceStates[M]>) =>
  (state: StoreState): StoreState => ({ ...state, [module]: { ...state[module], ...change } });

/** The screen a link is opened on: captured links were made on a phone held upright, examples on a desktop. */
type Screen = "phone" | "desktop";

/** The store opened on a link, without a browser. */
export const openLink = (path: string, query = "", screen: Screen = "phone"): StoreState =>
  createAppStore({
    url: readLocation(path, query),
    isMobile: screen === "phone",
    isPortrait: screen === "phone",
    theme: "dark",
  }).getState();

/** Opens a link and writes the link back from the state it opened. */
export const reopened = (path: string, query: string, screen: Screen = "phone") => searchFor(openLink(path, query, screen));

/** The state a page opens on without a query, to compare fallbacks with. */
export const defaultsOf = (path: string): StoreState => openLink(path);
