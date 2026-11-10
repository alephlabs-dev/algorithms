import { manifests } from "@/modules/manifests";
import { MODULES, type ModuleId, type Route } from "@/routes";

/** The modules with hints: every one, since each manifest has them. */
export const hintModules: ModuleId[] = MODULES;

/** Whether tapping the hint also opens the explanation it names: everywhere but a start page (and the landing page). */
export const hintOpens = (route: Route): boolean => route.page === "algorithm" || route.page === "race";

/** The hint's text on a page (from the module's manifest). The landing page reads like sorting's start page. */
export const hintLabel = (route: Route): string => {
  if (route.page === "home") return manifests.sorting.hints.start;
  // Each manifest's types hold where it's declared; here they're read through one shape.
  const hints = manifests[route.module].hints as { start: string; algorithm: (algorithm: string) => string; race?: string };
  if (route.page === "algorithm") return hints.algorithm(route.algorithm);
  return route.page === "race" ? hints.race! : hints.start;
};
