import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import type { ModuleId } from "./engine";
import { pathfindingUI } from "./pathfinding";
import { sortingUI } from "./sorting";
import type { ModuleUI } from "./types";

/** Every module's interface. Adding a module: an engine in ./engine.ts and an entry here. */
export const moduleUIs: Record<ModuleId, ModuleUI> = {
  sorting: sortingUI,
  pathfinding: pathfindingUI,
};

/** The interface of the module on stage. */
export const useModuleUI = () => moduleUIs[useStore((s) => s.module)];

/** The module's settings in a few words ("40 · Random"), for the buttons that open them. */
export const useSettingsSummary = () => {
  const { settingsSummary } = useModuleUI();
  return useStore(useShallow(settingsSummary));
};
