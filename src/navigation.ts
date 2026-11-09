import type { AppStore, StoreState } from "./appStore";
import { engines, type SliceAlgorithm } from "./modules/engine";
import { HOME, type Route } from "./routes";

/** The page the store is showing. */
export const routeFor = (s: StoreState): Route => (s.isLanding ? HOME : engines[s.module].route(s));

// The landing page is just the page: its address has nothing to carry.
export const searchFor = (s: StoreState) => (s.isLanding ? "" : engines[s.module].search(s));

/**
 * Moves the store to a page: the module with the page's algorithm (or the one it
 * last had), in the page's view. A page already on screen keeps its run.
 */
export const applyRoute = (app: AppStore, route: Route) => {
  const store = app.getState();
  if (route.page === "home") {
    store.pause();
    app.setState({ isLanding: true, isTourOpen: false });
    return;
  }
  const { module } = route;
  const current = engines[module].current(store);
  const algorithm = (route.page === "algorithm" ? route.algorithm : current) as SliceAlgorithm<typeof module>;
  if (route.page === "race") {
    if (store.module !== module) store.pick(module, algorithm);
    if (app.getState().view !== "race") store.setView("race");
  } else if (store.module !== module || store.view !== "single" || current !== algorithm) {
    store.pick(module, algorithm);
  }
  app.setState({ isLanding: false, isModuleStart: route.page === "start" });
};
