import { routeFromPath, routePath, type Route } from "./routes";
import { applyHead } from "./seo/head";
import { useStore, type StoreState } from "./store";
import type { Size } from "./types";
import { encodeCells } from "./pathfinding/grid";
import { toPathSearch, toSearch } from "./urlState";

/** The page the store is showing. */
export const routeFor = (s: StoreState): Route => {
  if (s.isHome) return { kind: "home" };
  if (s.module === "pathfinding")
    return s.view === "race" ? { kind: "pathRace" } : { kind: "path", algorithm: s.pathAlgorithm };
  if (s.view === "race") return { kind: "race" };
  return { kind: "algorithm", algorithm: s.activeAlgorithm };
};

const searchFor = (s: StoreState) =>
  s.module === "pathfinding"
    ? toPathSearch({
        gridSize: s.gridSize,
        cells: encodeCells(s.grid.cells),
        start: s.grid.start,
        end: s.grid.end,
        racers: s.pathRaceAlgorithms,
        speed: s.speedPreset,
      })
    : toSearch({
        // The store only ever holds sizes from the sizes list.
        size: s.size as Size,
        inputOrder: s.inputOrder,
        displayMode: s.displayMode,
        speed: s.speedPreset,
        seed: s.seed,
        raceAlgorithms: s.raceAlgorithms,
      });

const pageChanged = (a: StoreState, b: StoreState) =>
  a.isHome !== b.isHome ||
  a.module !== b.module ||
  a.view !== b.view ||
  (a.module === "pathfinding"
    ? a.pathAlgorithm !== b.pathAlgorithm
    : a.view === "single" && a.activeAlgorithm !== b.activeAlgorithm);

const settingsChanged = (a: StoreState, b: StoreState) =>
  a.size !== b.size ||
  a.inputOrder !== b.inputOrder ||
  a.displayMode !== b.displayMode ||
  a.speedPreset !== b.speedPreset ||
  a.seed !== b.seed ||
  a.raceAlgorithms !== b.raceAlgorithms ||
  a.pathRaceAlgorithms !== b.pathRaceAlgorithms ||
  a.grid !== b.grid;

/** Switches the app to a page, as a link click would. The URL follows through the sync below. */
export const navigate = (route: Route) => {
  const store = useStore.getState();
  const inPath = store.module === "pathfinding";
  if (route.kind === "path") {
    if (!inPath || store.view !== "single" || store.pathAlgorithm !== route.algorithm)
      store.setPathAlgorithm(route.algorithm);
    return;
  }
  if (route.kind === "pathRace") {
    if (!inPath) store.setPathAlgorithm(store.pathAlgorithm);
    if (useStore.getState().view !== "race") store.setView("race");
    return;
  }
  if (route.kind === "race") {
    if (inPath) store.setActiveAlgorithm(store.activeAlgorithm);
    if (useStore.getState().view !== "race") store.setView("race");
    return;
  }
  const algorithm = route.kind === "algorithm" ? route.algorithm : store.activeAlgorithm;
  if (inPath || store.view !== "single" || store.activeAlgorithm !== algorithm) store.setActiveAlgorithm(algorithm);
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
