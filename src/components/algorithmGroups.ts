import { useModuleUI } from "@/modules";
import type { SelectGroup } from "./ui/select";

/** The module's algorithms as a select's groups: sorting's by how they scale, each with its hint. */
export const useAlgorithmGroups = (): SelectGroup[] =>
  useModuleUI().algorithms.map((group) => ({
    label: group.label,
    hint: group.hint,
    options: group.items.map((item) => ({ value: item.id, label: item.title })),
  }));
