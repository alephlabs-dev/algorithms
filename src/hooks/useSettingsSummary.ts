import { inputOrders } from "@/consts/inputOrders";
import { useStore } from "@/store";

/** A one-line summary of the settings, for the button that opens them on phones. */
export const useSettingsSummary = () =>
  useStore((s) => {
    if (s.module === "pathfinding") return `${s.gridSize} grid · ${s.gridPreset}`;
    const parts = [`${s.size} items`, inputOrders[s.inputOrder].label];
    if (s.view !== "race") parts.push(s.displayMode === "bars" ? "Bars" : "Numbers");
    return parts.join(" · ");
  });
