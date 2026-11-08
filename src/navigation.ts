import type { AppStore, StoreState } from "./appStore";
import { engines } from "./modules/engine";
import { moduleOf, type Route } from "./routes";

/** The page the store is showing. */
export const routeFor = (s: StoreState): Route => (s.isLanding ? { kind: "home" } : engines[s.module].route(s));

// The landing page is just the page: its address has nothing to carry.
export const searchFor = (s: StoreState) => (s.isLanding ? "" : engines[s.module].search(s));

/** Moves the store to a page. Several updates may be needed (module, view, algorithm). */
export const applyRoute = (app: AppStore, route: Route) => {
  const store = app.getState();
  if (moduleOf(route) === null) {
    store.pause();
    app.setState({ isLanding: true, isTourOpen: false });
    return;
  }
  const inPath = store.module === "pathfinding";
  if (route.kind === "backtracking" || route.kind === "backtrackingProblem") {
    const problem = route.kind === "backtrackingProblem" ? route.algorithm : store.backtracking.problem;
    if (store.module !== "backtracking" || store.backtracking.problem !== problem) store.pick("backtracking", problem);
  } else if (route.kind === "dp" || route.kind === "dpProblem") {
    const algorithm = route.kind === "dpProblem" ? route.algorithm : store.dp.algorithm;
    if (store.module !== "dp" || store.view !== "single" || store.dp.algorithm !== algorithm)
      store.pick("dp", algorithm);
  } else if (route.kind === "dpRace") {
    if (store.module !== "dp") store.pick("dp", store.dp.algorithm);
    if (app.getState().view !== "race") store.setView("race");
  } else if (route.kind === "structure" || route.kind === "structures") {
    const algorithm = route.kind === "structure" ? route.algorithm : store.structures.algorithm;
    if (store.module !== "structures" || store.view !== "single" || store.structures.algorithm !== algorithm)
      store.pick("structures", algorithm);
  } else if (route.kind === "structureRace") {
    if (store.module !== "structures") store.pick("structures", store.structures.algorithm);
    if (app.getState().view !== "race") store.setView("race");
  } else if (route.kind === "series" || route.kind === "fourier") {
    const algorithm = route.kind === "series" ? route.algorithm : store.fourier.algorithm;
    if (store.module !== "fourier" || store.fourier.algorithm !== algorithm) store.pick("fourier", algorithm);
  } else if (route.kind === "graph" || route.kind === "graphs") {
    const algorithm = route.kind === "graph" ? route.algorithm : store.graphs.algorithm;
    if (store.module !== "graphs" || store.view !== "single" || store.graphs.algorithm !== algorithm)
      store.pick("graphs", algorithm);
  } else if (route.kind === "graphRace") {
    if (store.module !== "graphs") store.pick("graphs", store.graphs.algorithm);
    if (app.getState().view !== "race") store.setView("race");
  } else if (route.kind === "path" || route.kind === "pathfinding") {
    const algorithm = route.kind === "path" ? route.algorithm : store.pathfinding.algorithm;
    if (!inPath || store.view !== "single" || store.pathfinding.algorithm !== algorithm)
      store.pick("pathfinding", algorithm);
  } else if (route.kind === "pathRace") {
    if (!inPath) store.pick("pathfinding", store.pathfinding.algorithm);
    if (app.getState().view !== "race") store.setView("race");
  } else if (route.kind === "race") {
    if (store.module !== "sorting") store.pick("sorting", store.sorting.algorithm);
    if (app.getState().view !== "race") store.setView("race");
  } else {
    const algorithm = route.kind === "algorithm" ? route.algorithm : store.sorting.algorithm;
    if (store.module !== "sorting" || store.view !== "single" || store.sorting.algorithm !== algorithm)
      store.pick("sorting", algorithm);
  }
  app.setState({
    isLanding: false,
    isModuleStart:
      route.kind === "sorting" ||
      route.kind === "pathfinding" ||
      route.kind === "graphs" ||
      route.kind === "fourier" ||
      route.kind === "structures" ||
      route.kind === "dp" ||
      route.kind === "backtracking",
  });
};
