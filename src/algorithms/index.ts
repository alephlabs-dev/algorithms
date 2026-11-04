import type { Algorithm } from "@/types";
import type { SortAlgorithm } from "./types";
import { bubblePseudocode, bubbleSort } from "./bubbleSort";
import { cocktailPseudocode, cocktailSort } from "./cocktailSort";
import { heapPseudocode, heapSort } from "./heapSort";
import { insertionPseudocode, insertionSort } from "./insertionSort";
import { mergePseudocode, mergeSort } from "./mergeSort";
import { quickPseudocode, quickSort } from "./quickSort";
import { radixPseudocode, radixSort } from "./radixSort";
import { selectionPseudocode, selectionSort } from "./selectionSort";
import { shellPseudocode, shellSort } from "./shellSort";

// Key order is the order shown in the UI.
export const sortAlgorithms: Record<Algorithm, SortAlgorithm> = {
  selection: selectionSort,
  insertion: insertionSort,
  bubble: bubbleSort,
  cocktail: cocktailSort,
  shell: shellSort,
  quick: quickSort,
  merge: mergeSort,
  heap: heapSort,
  radix: radixSort,
};

/** Pseudocode per algorithm; `Frame.line` indexes into these. */
export const pseudocode: Record<Algorithm, string[]> = {
  selection: selectionPseudocode,
  insertion: insertionPseudocode,
  bubble: bubblePseudocode,
  cocktail: cocktailPseudocode,
  shell: shellPseudocode,
  quick: quickPseudocode,
  merge: mergePseudocode,
  heap: heapPseudocode,
  radix: radixPseudocode,
};

export { Timeline, range } from "./timeline";
export type { Frame, SortAlgorithm, Stats, Step } from "./types";
export type { StepKind } from "./timeline";
