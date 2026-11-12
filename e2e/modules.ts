import type { Page } from '@playwright/test';
import { manifests } from '../src/modules/manifests';
import { allRoutes, moduleOf, MODULES, moduleRoute, routePath, TRANSLATED_MODULES, type ModuleId, type Route } from '../src/routes';

// What shared specs know about the modules, all from the manifests: a new module is covered by every
// spec that uses these without editing it (docs/adr/0003).

export { MODULES, routePath, type ModuleId, type Route };

/** The algorithm ids a module has pages for (in backtracking, the problems). */
export const algorithmsOf = (module: ModuleId): string[] => Object.keys(manifests[module].pages.slugs);

/** A module's start page, its algorithm pages and its race page, if it has one. */
export const routesOf = (module: ModuleId): Route[] => allRoutes.filter((route) => moduleOf(route) === module);

/** A module's start page. */
export const startOf = (module: ModuleId): Route => moduleRoute(module, 'start');

/** One of a module's algorithm pages: the one its example link opens. */
export const algorithmPageOf = (module: ModuleId): Route => moduleRoute(module, 'algorithm', manifests[module].example.algorithm);

/** Whether a module's /es pages are in Spanish. */
export const isTranslated = (module: ModuleId) => TRANSLATED_MODULES.has(module);

/** Every module's tour key. */
export const TOUR_KEYS = MODULES.map((module) => manifests[module].tourKey);

/** Marks every module's tour as seen, so none opens over the page. Call before the first `gotoApp`. */
export const skipTours = (page: Page) =>
  page.addInitScript((keys) => keys.forEach((key) => localStorage.setItem(key, 'true')), TOUR_KEYS);
