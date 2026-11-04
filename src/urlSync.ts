import { routeFromPath, routePath, type Route } from "./routes";
import { applyHead } from "./seo/head";
import { useStore, type StoreState } from "./store";
import type { Size } from "./types";
import { toSearch } from "./urlState";

/** The page the store is showing. */
export const routeFor = (s: StoreState): Route => {
  if (s.isHome) return { kind: "home" };
  if (s.view === "race") return { kind: "race" };
  return { kind: "algorithm", algorithm: s.activeAlgorithm };
};

const searchFor = (s: StoreState) =>
  toSearch({
    // The store only ever holds sizes from the sizes list.
    size: s.size as Size,
    inputOrder: s.inputOrder,
    displayMode: s.displayMode,
    speed: s.speedPreset,
    seed: s.seed,
    raceAlgorithms: s.raceAlgorithms,
  });

const pageChanged = (a: StoreState, b: StoreState) =>
  a.isHome !== b.isHome || a.view !== b.view || (a.view === "single" && a.activeAlgorithm !== b.activeAlgorithm);

const settingsChanged = (a: StoreState, b: StoreState) =>
  a.size !== b.size ||
  a.inputOrder !== b.inputOrder ||
  a.displayMode !== b.displayMode ||
  a.speedPreset !== b.speedPreset ||
  a.seed !== b.seed ||
  a.raceAlgorithms !== b.raceAlgorithms;

/** Switches the app to a page, as a link click would. The URL follows through the sync below. */
export const navigate = (route: Route) => {
  const store = useStore.getState();
  if (route.kind === "race") {
    if (store.view !== "race") store.setView("race");
    return;
  }
  if (store.view !== "single") store.setView("single");
  if (route.kind === "algorithm" && store.activeAlgorithm !== route.algorithm) store.setActiveAlgorithm(route.algorithm);
  useStore.setState({ isHome: route.kind === "home" });
};

/**
 * Keeps the address bar in sync with the store, so the current URL is always
 * a shareable link. Changing page (algorithm or view) adds a history entry, so
 * Back works; changing settings replaces the current one.
 */
export const startUrlSync = () => {
  let timeout = 0;
  // Set while applying a Back/Forward navigation, so it isn't pushed again.
  let fromHistory = false;

  const write = (mode: "push" | "replace") => {
    const state = useStore.getState();
    const route = routeFor(state);
    const url = routePath(route) + searchFor(state);
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
    applyHead(route);
  };

  // Normalizes old ?algo=…&view=… links to their page's path.
  write("replace");

  useStore.subscribe((state, previous) => {
    if (fromHistory) return;
    if (pageChanged(state, previous)) {
      window.clearTimeout(timeout);
      write("push");
    } else if (settingsChanged(state, previous)) {
      // Playback changes the store every frame; only settings get here, debounced.
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => write("replace"), 150);
    }
  });

  window.addEventListener("popstate", () => {
    const route = routeFromPath(window.location.pathname) ?? { kind: "home" };
    fromHistory = true;
    navigate(route);
    fromHistory = false;
    applyHead(route);
  });
};
