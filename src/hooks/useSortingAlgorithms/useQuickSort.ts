import { StoreState, useStore } from "@/store";
import { markAsDone, sleep, swap } from "./utils";

type SortConfig = Pick<
  StoreState,
  "setItems" | "setActiveItems" | "setTempItems" | "setDoneItems" | "speedRef"
> & { signal: AbortSignal };

const partition = async (
  arr: number[],
  left: number,
  right: number,
  config: SortConfig
): Promise<number | null> => {
  const { setItems, setActiveItems, setTempItems, setDoneItems, speedRef, signal } =
    config;

  const pivotValue = arr[right];
  let pivotIndex = left;

  for (let i = left; i < right; i++) {
    setActiveItems([arr[i], pivotValue]);
    await sleep(speedRef.current, signal);
    if (signal.aborted) return null;

    if (arr[i] < pivotValue) {
      swap(arr, i, pivotIndex);
      pivotIndex++;
      setTempItems([...arr.slice(left, pivotIndex)]);
      setItems([...arr]);
    }
  }

  swap(arr, pivotIndex, right);
  setItems([...arr]);
  setTempItems([]);
  markAsDone(arr[pivotIndex], setDoneItems); // The pivot is now in its final place

  return pivotIndex;
};

const sort = async (
  arr: number[],
  left: number,
  right: number,
  config: SortConfig
): Promise<void> => {
  if (config.signal.aborted) return;

  if (left < right) {
    const partitionIndex = await partition(arr, left, right, config);
    if (partitionIndex === null) return;
    await sort(arr, left, partitionIndex - 1, config);
    await sort(arr, partitionIndex + 1, right, config);
  } else if (left === right) {
    markAsDone(arr[left], config.setDoneItems);
  }
};

export const useQuickSort = () => {
  const {
    items,
    setItems,
    setActiveItems,
    setTempItems,
    setDoneItems,
    speedRef,
  } = useStore();

  const handleSort = async (signal: AbortSignal) => {
    const config: SortConfig = {
      setItems,
      setActiveItems,
      setTempItems,
      setDoneItems,
      speedRef,
      signal,
    };

    await sort([...items], 0, items.length - 1, config);

    if (signal.aborted) setDoneItems([]);
    setActiveItems([]);
    setTempItems([]);
  };

  return handleSort;
};
