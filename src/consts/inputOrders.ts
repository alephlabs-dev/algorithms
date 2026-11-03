import type { InputOrder } from "@/types";

export const inputOrders: Record<InputOrder, { label: string; shortLabel: string }> = {
  random: { label: "Random", shortLabel: "Random" },
  nearlySorted: { label: "Nearly sorted", shortLabel: "Nearly" },
  reversed: { label: "Reversed", shortLabel: "Reversed" },
  sorted: { label: "Sorted", shortLabel: "Sorted" },
  fewUnique: { label: "Few unique", shortLabel: "Few" },
};
