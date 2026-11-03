import type { Algorithm } from "@/types";
import type { SortAlgorithm } from "./types";
import { bubbleSort } from "./bubbleSort";
import { insertionSort } from "./insertionSort";
import { mergeSort } from "./mergeSort";
import { quickSort } from "./quickSort";
import { selectionSort } from "./selectionSort";

export const sortAlgorithms: Record<Algorithm, SortAlgorithm> = {
  selection: selectionSort,
  insertion: insertionSort,
  bubble: bubbleSort,
  quick: quickSort,
  merge: mergeSort,
};

export { Timeline, range } from "./timeline";
export type { Frame, SortAlgorithm, Stats, Step } from "./types";
