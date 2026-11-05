import { localized } from "@/i18n";
import type { Algorithm } from "@/types";

const labels = localized({
  en: { simple: "Simple", fast: "Fast", noComparisons: "No comparisons" },
  es: { simple: "Simples", fast: "Rápidos", noComparisons: "Sin comparaciones" },
});

/** Algorithms grouped by how they scale, which is the first thing to learn about them. */
export const algorithmGroups: { label: string; hint: string; algorithms: Algorithm[] }[] = [
  { label: labels.simple, hint: "O(n²)", algorithms: ["selection", "insertion", "bubble", "cocktail"] },
  { label: labels.fast, hint: "≈ O(n log n)", algorithms: ["shell", "quick", "merge", "heap"] },
  { label: labels.noComparisons, hint: "O(d·n)", algorithms: ["radix"] },
];
