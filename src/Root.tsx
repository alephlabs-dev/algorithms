import { Analytics } from "@vercel/analytics/react";
import { useEffect, useSyncExternalStore } from "react";
import { useShallow } from "zustand/react/shallow";
import App from "./App";
import { LanguageButton } from "./components/LanguageSwitch";
import { ThemeToggle } from "./components/ThemeToggle";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { routeFor } from "./navigation";
import { Page } from "./Page";
import { MOBILE_QUERY, PORTRAIT_QUERY, useStore } from "./store";
import { navigate } from "./urlSync";

/** Keeps the store's idea of the screen in step with the window. */
const ScreenSync = () => {
  const setIsMobile = useStore((s) => s.setIsMobile);
  const setIsPortrait = useStore((s) => s.setIsPortrait);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const isPortrait = useMediaQuery(PORTRAIT_QUERY);

  useEffect(() => {
    setIsMobile(isMobile);
  }, [isMobile, setIsMobile]);

  useEffect(() => {
    setIsPortrait(isPortrait);
  }, [isPortrait, setIsPortrait]);

  return null;
};

const never = () => () => {};

/**
 * False while React hydrates the prerendered page (the server's answer), true
 * right after: React re-renders with the browser's answer once hydration is
 * done. With no prerendered HTML (the dev server) it's true from the start.
 */
const useHydrated = () =>
  useSyncExternalStore(
    never,
    () => true,
    () => false
  );

/**
 * The app's root. Its first render matches the prerendered page exactly, so
 * React hydrates that HTML instead of replacing it (#140). The stage, the
 * landing header's controls and anything else that reads the browser come in
 * right after, once hydration has finished.
 */
export function Root() {
  const route = useStore(useShallow(routeFor));
  const hydrated = useHydrated();

  // Marks the moment the whole app is live (stage included), so e2e tests
  // know they can use it (#116).
  useEffect(() => {
    if (hydrated) document.documentElement.dataset.ready = "";
  }, [hydrated]);

  return (
    <Page
      route={route}
      onNavigate={navigate}
      stage={hydrated && <App />}
      actions={
        hydrated && (
          <>
            <ThemeToggle />
            <LanguageButton />
          </>
        )
      }
      client={
        hydrated && (
          <>
            <ScreenSync />
            {/* Vercel Web Analytics: page views, no cookies. Inactive outside Vercel deployments. */}
            <Analytics />
          </>
        )
      }
    />
  );
}
