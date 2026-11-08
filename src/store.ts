import { createAppStore, MOBILE_QUERY, PORTRAIT_QUERY, type StoreEnv } from "./appStore";
import { readLocation } from "./urlState";

export * from "./appStore";

/** The one place the store reads the browser: the page's link, the screen and the theme already applied. */
const browserEnv = (): StoreEnv => ({
  url: readLocation(window.location.pathname, window.location.search),
  isMobile: window.matchMedia(MOBILE_QUERY).matches,
  isPortrait: window.matchMedia(PORTRAIT_QUERY).matches,
  theme: document.documentElement.dataset.theme === "light" ? "light" : "dark",
});

export const useStore = createAppStore(browserEnv());
