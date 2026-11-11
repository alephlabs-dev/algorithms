import { manifests } from "@/modules/manifests";
import { MODULES, type ModuleId, type Route } from "@/routes";

export type ModuleInfo = {
  id: ModuleId;
  title: string;
  summary: string;
  /** How much is in it, e.g. "9 algorithms". Modules still in preparation have none. */
  count?: string;
  /** Its own page. Modules still in preparation have none. */
  route?: Route;
};

/** Every module, in the order the landing page lists them (the manifests' order), with its card from its manifest. */
export const modules: ModuleInfo[] = MODULES.map((id) => ({
  id,
  ...manifests[id].landing,
  route: { module: id, page: "start" },
}));
