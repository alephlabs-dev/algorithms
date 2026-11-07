import { create } from "zustand";

/** The side panel's tabs (iPad landscape and desktop). */
export type PanelTab = "settings" | "code";

const KEY = "side-panel-tab";

// Remembered for the browser session; Settings when there's nothing (or no storage).
const remembered = (): PanelTab => {
  try {
    return window.sessionStorage.getItem(KEY) === "code" ? "code" : "settings";
  } catch {
    return "settings";
  }
};

export const usePanelTab = create<{ tab: PanelTab; setTab: (tab: PanelTab) => void }>((set) => ({
  tab: typeof window === "undefined" ? "settings" : remembered(),
  setTab: (tab) => {
    set({ tab });
    try {
      window.sessionStorage.setItem(KEY, tab);
    } catch {
      // Blocked storage: the tab just isn't remembered.
    }
  },
}));
