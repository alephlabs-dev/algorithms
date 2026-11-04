import type { InputOrder } from "@/types";

export const inputOrders: Record<InputOrder, { label: string; description: string }> = {
  random: { label: "Random", description: "Shuffled values: the typical case." },
  nearlySorted: { label: "Nearly sorted", description: "A few neighbours swapped: best case for insertion and bubble sort." },
  reversed: { label: "Reversed", description: "Largest first: the worst case for many algorithms." },
  sorted: { label: "Sorted", description: "Already in order: shows which algorithms notice." },
  fewUnique: { label: "Few unique", description: "Only five distinct values, repeated: shows how ties are handled." },
};
