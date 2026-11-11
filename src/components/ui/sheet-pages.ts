import { createContext, useContext } from "react";

/**
 * A page a sheet slides to in place, like iOS Settings (UX.md rule 8: never a second sheet).
 * `id` names who owns it, `visit` counts the times it was opened, `slot` is where its content goes,
 * `shown` whether it's on screen.
 */
export type SheetPages = {
  page: { id: string; title: string; visit: number } | null;
  shown: boolean;
  slot: HTMLElement | null;
  open: (id: string, title: string, from: HTMLElement | null) => void;
  back: () => void;
};

export const SheetPagesContext = createContext<SheetPages | null>(null);

/** Inside a modal sheet: how to slide to a page of it and back. Null outside one. */
export const useSheetPages = () => useContext(SheetPagesContext);
