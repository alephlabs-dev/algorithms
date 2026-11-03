import { StoreState, useStore } from "@/store";
import { sleep, swap } from "./utils";

type BubbleConfig = Pick<
  StoreState,
  "speedRef" | "setItems" | "setActiveItems" | "setDoneItems"
> & { arr: number[]; signal: AbortSignal };

// Returns false if the run was aborted.
const bubble = async ({
  arr,
  setItems,
  setActiveItems,
  setDoneItems,
  speedRef,
  signal,
}: BubbleConfig): Promise<boolean> => {
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    let swapped = false;
    for (let j = 0; j < len - 1 - i; j++) {
      setActiveItems([arr[j], arr[j + 1]]);
      await sleep(speedRef.current, signal);
      if (signal.aborted) return false;

      if (arr[j] > arr[j + 1]) {
        swap(arr, j, j + 1);
        setItems([...arr]);
        swapped = true;
      }
    }
    // A pass without swaps means the rest is already sorted (best case O(n)).
    if (!swapped) return true;
    setDoneItems((prev) => [...prev, arr[len - 1 - i]]);
  }
  return true;
};

export const useBubbleSort = () => {
  const { items, setItems, setActiveItems, setDoneItems, speedRef } =
    useStore();

  const sort = async (signal: AbortSignal) => {
    const result = [...items];
    const finished = await bubble({
      arr: result,
      setItems,
      setActiveItems,
      setDoneItems,
      speedRef,
      signal,
    });
    setActiveItems([]);
    setDoneItems(finished ? [...result] : []);
  };

  return sort;
};
