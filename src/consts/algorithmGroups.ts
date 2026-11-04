import type { Algorithm } from "@/types";

/** Algorithms grouped by how they scale, which is the first thing to learn about them. */
export const algorithmGroups: { label: string; hint: string; algorithms: Algorithm[] }[] = [
  { label: "Simple", hint: "O(n²)", algorithms: ["selection", "insertion", "bubble", "cocktail"] },
  { label: "Fast", hint: "≈ O(n log n)", algorithms: ["shell", "quick", "merge", "heap"] },
  { label: "No comparisons", hint: "O(d·n)", algorithms: ["radix"] },
];
