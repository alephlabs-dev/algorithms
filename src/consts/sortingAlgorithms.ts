import type { Algorithm } from "@/types";

type AlgorithmDetails = {
  title: string;
  shortDescription: string;
  longDescription: string;
  timeComplexity: {
    best: string;
    average: string;
    worst: string;
  };
  /** Extra memory beyond the array itself. */
  space: string;
  /** Keeps equal values in their original order. */
  stable: boolean;
  /** What the yellow highlight means for this algorithm, if it uses it. */
  tempLabel?: string;
  /** The algorithm moves values by writing them rather than swapping (merge, radix). */
  countsWrites?: boolean;
};

// Key order is the order shown in the UI; keep it in sync with `sortAlgorithms`.

export const sortingAlgorithms: Record<Algorithm, AlgorithmDetails> = {
  selection: {
    title: "Selection Sort",
    shortDescription:
      "Efficient for small datasets, minimizing swaps, but performs poorly on larger or nearly sorted datasets due to its O(n²) complexity.",
    longDescription:
      "Selection Sort is a basic algorithm that works by repeatedly selecting the smallest unsorted element and moving it to the sorted portion of the list. It’s simple and minimizes swaps, which is beneficial when memory writes are costly. However, with an O(n²) time complexity, it becomes inefficient on larger datasets or nearly sorted arrays, making it more suitable for small collections.",
    space: "O(1)",
    stable: false,
    timeComplexity: {
      best: "O(n²)",
      average: "O(n²)",
      worst: "O(n²)",
    },
  },
  insertion: {
    title: "Insertion Sort",
    shortDescription:
      "Efficient for small or nearly sorted datasets, with a best-case O(n) time complexity, but inefficient for larger, random datasets.",
    longDescription:
      "Insertion Sort is a simple algorithm that builds a sorted array one element at a time. It’s efficient on small or nearly sorted datasets, achieving a best-case O(n) time complexity. However, its O(n²) complexity in average and worst cases makes it less suitable for large, random datasets. The algorithm iteratively places each item into its proper place within the sorted portion of the array.",
    space: "O(1)",
    stable: true,
    timeComplexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)",
    },
    tempLabel: "Sorted section",
  },
  bubble: {
    title: "Bubble Sort",
    shortDescription:
      "Ideal for nearly sorted datasets, simple to implement, but highly inefficient on large unsorted arrays due to its O(n²) complexity.",
    longDescription:
      "Bubble Sort is a straightforward algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if necessary. It’s best suited for nearly sorted arrays, where its best-case time complexity is O(n). Despite its simplicity, Bubble Sort is inefficient for large datasets, as its average and worst-case complexities are both O(n²).",
    space: "O(1)",
    stable: true,
    timeComplexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)",
    },
  },
  cocktail: {
    title: "Cocktail Shaker Sort",
    shortDescription:
      "A two-way Bubble Sort that also moves small values left, so it handles nearly sorted data well, but it's still O(n²) on average.",
    longDescription:
      "Cocktail Shaker Sort is a variation of Bubble Sort that sweeps through the list in both directions: a forward pass carries the largest value to the end, and a backward pass carries the smallest value to the front. This fixes Bubble Sort's weakness with small values stuck near the end (the “turtles”), and it stops as soon as a pass makes no swaps, giving a best case of O(n). Its average and worst cases remain O(n²), so it's mostly useful on small or nearly sorted arrays.",
    space: "O(1)",
    stable: true,
    timeComplexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)",
    },
  },
  shell: {
    title: "Shell Sort",
    shortDescription:
      "An Insertion Sort on items far apart first, then closer and closer, which moves values long distances early and is much faster in practice.",
    longDescription:
      "Shell Sort generalizes Insertion Sort by first sorting items that are a large gap apart, then shrinking the gap until it reaches 1, where it becomes a regular Insertion Sort on an almost sorted array. Moving values across long distances early saves a lot of work later. Its performance depends on the gap sequence: with the simple halving gaps used here it runs in roughly O(n^1.5) on average and O(n²) in the worst case, while using no extra memory.",
    space: "O(1)",
    stable: false,
    timeComplexity: {
      best: "O(n log n)",
      average: "O(n^1.5)",
      worst: "O(n²)",
    },
    tempLabel: "Same gap group",
  },
  quick: {
    title: "Quick Sort",
    shortDescription:
      "Fast and efficient for most cases, with an average time complexity of O(n log n), though pivot choice can sometimes lead to suboptimal performance.",
    longDescription:
      "Quick Sort is a highly efficient sorting algorithm that works by partitioning an array around a pivot and recursively sorting the sub-arrays. It typically achieves O(n log n) time complexity, making it very fast in practice. However, if the pivot choice is poor, it can degrade to O(n²). Despite this, Quick Sort is widely used due to its superior average performance and minimal memory usage.",
    space: "O(log n)",
    stable: false,
    timeComplexity: {
      best: "O(n log n)",
      average: "O(n log n)",
      worst: "O(n²)",
    },
    tempLabel: "Smaller than pivot",
  },
  merge: {
    title: "Merge Sort",
    shortDescription:
      "Merge Sort is consistent and stable with predictable performance, ideal for large datasets, but requires additional memory.",
    longDescription:
      "Merge Sort is a stable and reliable sorting algorithm that divides the array into smaller sub-arrays, sorts them, and then merges them back together. Its time complexity is O(n log n) in all cases, making it suitable for large datasets. However, its need for additional memory during the merging process can be a limitation in resource-constrained environments.",
    space: "O(n)",
    stable: true,
    timeComplexity: {
      best: "O(n log n)",
      average: "O(n log n)",
      worst: "O(n log n)",
    },
    tempLabel: "Merged",
    countsWrites: true,
  },
  heap: {
    title: "Heap Sort",
    shortDescription:
      "Builds a max-heap and repeatedly moves the largest value to the end, guaranteeing O(n log n) with no extra memory.",
    longDescription:
      "Heap Sort first rearranges the array into a max-heap, a tree stored in the array where every parent is larger than its children, so the largest value sits at the root. It then swaps the root with the last unsorted item, shrinks the heap by one, and sifts the new root down to restore the heap. This guarantees O(n log n) time in every case and sorts in place, though it isn't stable and tends to be slower than Quick Sort in practice.",
    space: "O(1)",
    stable: false,
    timeComplexity: {
      best: "O(n log n)",
      average: "O(n log n)",
      worst: "O(n log n)",
    },
  },
  radix: {
    title: "Radix Sort",
    shortDescription:
      "Sorts numbers digit by digit without ever comparing two values, in time proportional to the number of digits.",
    longDescription:
      "Radix Sort (LSD) never compares values against each other. Instead, it groups the numbers by their last digit, then by the next one, and so on up to the most significant digit. Each pass is stable, so the order from earlier digits is preserved, and after the last pass the array is sorted. Its time is O(d·n), where d is the number of digits, which beats comparison sorts for integers with few digits, at the cost of extra memory for the buckets.",
    space: "O(n + k)",
    stable: true,
    timeComplexity: {
      best: "O(d·n)",
      average: "O(d·n)",
      worst: "O(d·n)",
    },
    tempLabel: "Placed this pass",
    countsWrites: true,
  },
};
