import { create } from "zustand";

/** The non-modal sheets: settings and the pseudocode. */
export type SheetId = "settings" | "code";

type Sheets = {
  open: SheetId | null;
  /** The button that opened the sheet, to give focus back when it closes. */
  trigger: HTMLElement | null;
  toggle: (id: SheetId, trigger?: HTMLElement | null) => void;
  close: () => void;
};

/** At most one sheet is open: opening one closes the other. */
export const useSheets = create<Sheets>((set, get) => ({
  open: null,
  trigger: null,
  toggle: (id, trigger = null) => (get().open === id ? get().close() : set({ open: id, trigger })),
  close: () => {
    const { open, trigger } = get();
    if (!open) return;
    set({ open: null, trigger: null });
    if (trigger?.isConnected && trigger.getClientRects().length > 0) trigger.focus({ preventScroll: true });
  },
}));

/** The attributes of a button that opens a sheet. */
export const useSheetTrigger = (id: SheetId) => {
  const open = useSheets((s) => s.open === id);
  const toggle = useSheets((s) => s.toggle);
  return {
    "aria-expanded": open,
    "aria-controls": `sheet-${id}`,
    onClick: (event: { currentTarget: HTMLElement }) => toggle(id, event.currentTarget),
  };
};
