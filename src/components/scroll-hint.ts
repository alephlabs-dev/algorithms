import { localized } from "@/i18n";
import { manifests } from "@/modules/manifests";
import { MODULES, type ModuleId, type Route } from "@/routes";

// The hints' shared wording; each module's manifest gives only its own part.
const text = localized({
  en: {
    works: (it: string) => `How ${it} works`,
    race: "How the race works",
  },
  es: {
    // "las series" and "los árboles" take the plural.
    works: (it) => `${/^l(o|a)s /.test(it) ? "Cómo funcionan" : "Cómo funciona"} ${it}`,
    race: "Cómo funciona la carrera",
  },
});

/** The modules with hints: every one, since each manifest has them. */
export const hintModules: ModuleId[] = MODULES;

/** Whether tapping the hint also opens the explanation it names: everywhere but a start page (and the landing page). */
export const hintOpens = (route: Route): boolean => route.page === "algorithm" || route.page === "race";

/** The hint's text on a page (from the module's manifest). The landing page reads like sorting's start page. */
export const hintLabel = (route: Route): string => {
  if (route.page === "home") return manifests.sorting.hints.start;
  // Each manifest's types hold where it's declared; here they're read through one shape.
  const hints = manifests[route.module].hints as {
    start: string;
    race?: string;
    works?: (algorithm: string) => string;
    heading?: (algorithm: string) => string;
  };
  if (route.page === "race") return hints.race ?? text.race;
  if (route.page === "start") return hints.start;
  return hints.heading?.(route.algorithm) ?? text.works(hints.works!(route.algorithm));
};
