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
    const problem = route.kind === "backtrackingProblem" ? route.algorithm : store.backtrackingProblem;
    if (store.module !== "backtracking" || store.backtrackingProblem !== problem) store.setBacktrackingProblem(problem);
  } else if (route.kind === "dp" || route.kind === "dpProblem") {
    const algorithm = route.kind === "dpProblem" ? route.algorithm : store.dpAlgorithm;
    if (store.module !== "dp" || store.view !== "single" || store.dpAlgorithm !== algorithm)
      store.setDpAlgorithm(algorithm);
  } else if (route.kind === "dpRace") {
    if (store.module !== "dp") store.setDpAlgorithm(store.dpAlgorithm);
    if (app.getState().view !== "race") store.setView("race");
  } else if (route.kind === "structure" || route.kind === "structures") {
    const algorithm = route.kind === "structure" ? route.algorithm : store.structureAlgorithm;
    if (store.module !== "structures" || store.view !== "single" || store.structureAlgorithm !== algorithm)
      store.setStructureAlgorithm(algorithm);
  } else if (route.kind === "structureRace") {
    if (store.module !== "structures") store.setStructureAlgorithm(store.structureAlgorithm);
    if (app.getState().view !== "race") store.setView("race");
  } else if (route.kind === "series" || route.kind === "fourier") {
    const algorithm = route.kind === "series" ? route.algorithm : store.fourierAlgorithm;
    if (store.module !== "fourier" || store.fourierAlgorithm !== algorithm) store.setFourierAlgorithm(algorithm);
  } else if (route.kind === "graph" || route.kind === "graphs") {
    const algorithm = route.kind === "graph" ? route.algorithm : store.graphAlgorithm;
    if (store.module !== "graphs" || store.view !== "single" || store.graphAlgorithm !== algorithm)
      store.setGraphAlgorithm(algorithm);
  } else if (route.kind === "graphRace") {
    if (store.module !== "graphs") store.setGraphAlgorithm(store.graphAlgorithm);
    if (app.getState().view !== "race") store.setView("race");
  } else if (route.kind === "path" || route.kind === "pathfinding") {
    const algorithm = route.kind === "path" ? route.algorithm : store.pathAlgorithm;
    if (!inPath || store.view !== "single" || store.pathAlgorithm !== algorithm) store.setPathAlgorithm(algorithm);
  } else if (route.kind === "pathRace") {
    if (!inPath) store.setPathAlgorithm(store.pathAlgorithm);
    if (app.getState().view !== "race") store.setView("race");
  } else if (route.kind === "race") {
    if (store.module !== "sorting") store.setActiveAlgorithm(store.activeAlgorithm);
    if (app.getState().view !== "race") store.setView("race");
  } else {
    const algorithm = route.kind === "algorithm" ? route.algorithm : store.activeAlgorithm;
    if (store.module !== "sorting" || store.view !== "single" || store.activeAlgorithm !== algorithm)
      store.setActiveAlgorithm(algorithm);
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
