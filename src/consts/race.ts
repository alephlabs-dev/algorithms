import { localized } from "@/i18n";

export const RACE_DESCRIPTION = localized({
  en: "Same array, same clock. Each tick is one operation (a comparison, a swap or a write), so the lanes show how much work each algorithm really does.",
  es: "Mismo arreglo, mismo reloj. Cada tic es una operación (una comparación, un intercambio o una escritura), así que los carriles muestran cuánto trabajo hace de verdad cada algoritmo.",
});

export const STRUCTURE_RACE_DESCRIPTION =
  "The same values, in the same order, into a plain binary search tree and an AVL tree. Each tick, both take one step. Feed them ascending values to see why balancing exists.";

export const GRAPH_RACE_DESCRIPTION =
  "Same graph, same clock. Each tick, every algorithm takes one step, so the first to finish is the one with the least to do. Prim and Kruskal always end with trees of the same weight, by different routes.";

export const PATH_RACE_DESCRIPTION = localized({
  en: "Same grid, same clock. Each tick, every search examines one cell, so the first to reach the target is the one that looked at the fewest cells. Then compare the paths they found.",
  es: "Misma cuadrícula, mismo reloj. En cada tic, cada búsqueda revisa una celda, así que la primera en llegar al destino es la que revisó menos celdas. Después compara los caminos que encontraron.",
});

export const DP_RACE_DESCRIPTION =
  "The same knapsack three ways, one subproblem per tick each. The table fills every cell once, row by row. Plain recursion asks for the corner and splits each question in two, so it works out the same subproblems again and again, and the count grows exponentially with the items. Memoized recursion asks the same way but writes each answer down: a repeat is a lookup, and it only touches the cells the answer needs.";
