import { useSyncExternalStore } from "react";
import { useModuleUI } from "@/modules";
import { engines } from "@/modules/engine";
import { selectGameUnavailable, selectGuessPlaying, useStore, type View } from "@/store";

/** Whether the module on stage has guess mode, so the view switch offers the guess view. */
const useHasGame = () => useStore((s) => engines[s.module].game !== undefined);

/** The views the module on stage has: always one run; a race and a guessing game where it has them. */
export const useViews = (): View[] => {
  const hasRace = useModuleUI().race !== undefined;
  const hasGame = useHasGame();
  return ["single", ...(hasRace ? ["race" as const] : []), ...(hasGame ? ["guess" as const] : [])];
};

/** Whether the module on stage has more than one view, so the switch shows. */
export const useHasViewSwitch = () => useViews().length > 1;

const SEEN_KEY = "guess-seen";
// Remembered per browser: until someone has tried it, the Guess view says it's new (the tour may be long done).
const readSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === "true";
  } catch {
    return true;
  }
};
let seen = readSeen();
const seenListeners = new Set<() => void>();
const subscribeSeen = (listener: () => void) => {
  seenListeners.add(listener);
  return () => seenListeners.delete(listener);
};

// Trying Guess is being in the guess view with a run it can play: from then on it's no longer new.
useStore.subscribe((s) => {
  if (seen || !selectGuessPlaying(s)) return;
  seen = true;
  seenListeners.forEach((listener) => listener());
  try {
    localStorage.setItem(SEEN_KEY, "true");
  } catch {
    // Private mode: it just says "new" again next time.
  }
});

/**
 * The guess view is new to this browser and can be tried on the run on stage: a view that
 * only says why it can't play would never clear it.
 */
export const useGuessIsNew = () => {
  const isSeen = useSyncExternalStore(subscribeSeen, () => seen, () => true);
  const unavailable = useStore(selectGameUnavailable);
  return !isSeen && unavailable === null;
};
