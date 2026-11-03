import { useStore, type StoreState } from "./store";
import type { Size } from "./types";
import { toSearch } from "./urlState";

const searchFor = (s: StoreState) =>
  toSearch({
    algorithm: s.activeAlgorithm,
    // The store only ever holds sizes from the sizes list.
    size: s.size as Size,
    inputOrder: s.inputOrder,
    displayMode: s.displayMode,
    speed: s.speedIsAuto ? undefined : s.speed,
    seed: s.seed,
    view: s.view,
    raceAlgorithms: s.raceAlgorithms,
  });

const settingsChanged = (a: StoreState, b: StoreState) =>
  a.activeAlgorithm !== b.activeAlgorithm ||
  a.size !== b.size ||
  a.inputOrder !== b.inputOrder ||
  a.displayMode !== b.displayMode ||
  a.speed !== b.speed ||
  a.speedIsAuto !== b.speedIsAuto ||
  a.seed !== b.seed ||
  a.view !== b.view ||
  a.raceAlgorithms !== b.raceAlgorithms;

/**
 * Keeps the address bar in sync with the settings, so the current URL is always
 * a shareable link. Uses replaceState so it doesn't fill the history.
 */
export const startUrlSync = () => {
  let timeout = 0;
  const write = () => {
    window.history.replaceState(null, "", searchFor(useStore.getState()));
  };
  write();
  useStore.subscribe((state, previous) => {
    // Playback changes the store every frame; only settings matter here.
    if (!settingsChanged(state, previous)) return;
    // Debounced so dragging the speed slider doesn't spam history updates.
    window.clearTimeout(timeout);
    timeout = window.setTimeout(write, 150);
  });
};
