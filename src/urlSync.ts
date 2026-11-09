import { applyRoute, routeFor, searchFor } from "./navigation";
import { href, routeFromPath, routePath, type Route } from "./routes";
import { applyHead } from "./seo/head";
import { tourDone, useStore, type StoreState } from "./store";

const pageChanged = (a: StoreState, b: StoreState) => routePath(routeFor(a)) !== routePath(routeFor(b));

// Playback moves these every frame; nothing in them belongs in a link.
const PLAYBACK: ReadonlySet<string> = new Set(["frameIndex", "isPlaying", "isScrubbing"]);

/**
 * Whether the link should change: something besides playback changed, and the
 * module's query string comes out different. Whatever an engine puts in its
 * link is followed, with no list here to keep up to date.
 */
const settingsChanged = (a: StoreState, b: StoreState) => {
  const keys = Object.keys(a) as (keyof StoreState)[];
  if (keys.every((key) => PLAYBACK.has(key) || a[key] === b[key])) return false;
  return searchFor(a) !== searchFor(b);
};

// Set while applying a Back/Forward navigation, so it isn't pushed again.
let fromHistory = false;
// Set while a navigation runs: it can take a few store updates, but makes one history entry.
let batching = false;
// Writes the store's page into the address bar; set up by startUrlSync.
let write: (mode: "push" | "replace") => void = () => {};

/** Switches the app to a page, as a link click would, with one history entry for it. */
export const navigate = (route: Route) => {
  const before = useStore.getState();
  batching = true;
  try {
    applyRoute(useStore, route);
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
    const url = href(route) + searchFor(state);
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
    const route = routeFromPath(window.location.pathname) ?? { page: "home" };
    fromHistory = true;
    navigate(route);
    fromHistory = false;
    applyHead(route);
  });
};
