import { moduleOf, routeFromPath, routePath, type Route } from "./routes";
import { applyHead } from "./seo/head";
import { tourDone, useStore, type StoreState } from "./store";
import { engines } from "./modules/engine";

/** The page the store is showing. */
export const routeFor = (s: StoreState): Route => (s.isLanding ? { kind: "home" } : engines[s.module].route(s));

// The landing page is just the page: its address has nothing to carry.
const searchFor = (s: StoreState) => (s.isLanding ? "" : engines[s.module].search(s));

const pageChanged = (a: StoreState, b: StoreState) => routePath(routeFor(a)) !== routePath(routeFor(b));

const settingsChanged = (a: StoreState, b: StoreState) =>
  a.size !== b.size ||
  a.inputOrder !== b.inputOrder ||
  a.displayMode !== b.displayMode ||
  a.speedPreset !== b.speedPreset ||
  a.seed !== b.seed ||
  a.raceAlgorithms !== b.raceAlgorithms ||
  a.pathRaceAlgorithms !== b.pathRaceAlgorithms ||
  a.grid !== b.grid;

// Set while applying a Back/Forward navigation, so it isn't pushed again.
let fromHistory = false;
// Set while a navigation runs: it can take a few store updates, but makes one history entry.
let batching = false;
// Writes the store's page into the address bar; set up by startUrlSync.
let write: (mode: "push" | "replace") => void = () => {};

/** Moves the store to a page. Several updates may be needed (module, view, algorithm). */
const applyRoute = (route: Route) => {
  const store = useStore.getState();
  if (moduleOf(route) === null) {
    store.pause();
    useStore.setState({ isLanding: true, isTourOpen: false });
    return;
  }
  const inPath = store.module === "pathfinding";
  if (route.kind === "graph" || route.kind === "graphs") {
    const algorithm = route.kind === "graph" ? route.algorithm : store.graphAlgorithm;
    if (store.module !== "graphs" || store.view !== "single" || store.graphAlgorithm !== algorithm)
      store.setGraphAlgorithm(algorithm);
  } else if (route.kind === "graphRace") {
    if (store.module !== "graphs") store.setGraphAlgorithm(store.graphAlgorithm);
    if (useStore.getState().view !== "race") store.setView("race");
  } else if (route.kind === "path" || route.kind === "pathfinding") {
    const algorithm = route.kind === "path" ? route.algorithm : store.pathAlgorithm;
    if (!inPath || store.view !== "single" || store.pathAlgorithm !== algorithm) store.setPathAlgorithm(algorithm);
  } else if (route.kind === "pathRace") {
    if (!inPath) store.setPathAlgorithm(store.pathAlgorithm);
    if (useStore.getState().view !== "race") store.setView("race");
  } else if (route.kind === "race") {
    if (store.module !== "sorting") store.setActiveAlgorithm(store.activeAlgorithm);
    if (useStore.getState().view !== "race") store.setView("race");
  } else {
    const algorithm = route.kind === "algorithm" ? route.algorithm : store.activeAlgorithm;
    if (store.module !== "sorting" || store.view !== "single" || store.activeAlgorithm !== algorithm)
      store.setActiveAlgorithm(algorithm);
  }
  useStore.setState({
    isLanding: false,
    isModuleStart: route.kind === "sorting" || route.kind === "pathfinding" || route.kind === "graphs",
  });
};

/** Switches the app to a page, as a link click would, with one history entry for it. */
export const navigate = (route: Route) => {
  const before = useStore.getState();
  batching = true;
  try {
    applyRoute(route);
  } finally {
    batching = false;
  }
  const after = useStore.getState();
  if (!fromHistory) {
    if (pageChanged(after, before)) write("push");
    else if (settingsChanged(after, before)) write("replace");
  }
  // Arriving in a module for the first time (from the landing page or the other module): show how it works.
  const arrived = !after.isLanding && (before.isLanding || before.module !== after.module);
  if (arrived && after.view === "single" && !tourDone(after.module)) after.openTour();
};

/**
 * Keeps the address bar in sync with the store, so the current URL is always
 * a shareable link. Changing page (algorithm or view) adds a history entry, so
 * Back works; changing settings replaces the current one.
 */
export const startUrlSync = () => {
  let timeout = 0;

  write = (mode) => {
    window.clearTimeout(timeout);
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
    if (fromHistory || batching) return;
    if (pageChanged(state, previous)) {
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
