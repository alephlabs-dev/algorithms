import { StoreState, useStore } from "@/store";
import { sleep } from "./utils";

type SortConfig = Pick<
  StoreState,
  "setItems" | "setActiveItems" | "setTempItems" | "speedRef"
> & { signal: AbortSignal };

// Returns null if the run was aborted.
const merge = async (
  leftArr: number[],
  rightArr: number[],
  config: SortConfig
): Promise<number[] | null> => {
  const { setItems, setActiveItems, speedRef, setTempItems, signal } = config;

  const sortedArray: number[] = [];
  setActiveItems([...leftArr, ...rightArr]);
  await sleep(speedRef.current, signal);
  if (signal.aborted) return null;

  while (leftArr.length || rightArr.length) {
    if (leftArr.length && rightArr.length) {
      // `<=` takes from the left on ties, which keeps the sort stable.
      if (leftArr[0] <= rightArr[0]) {
        sortedArray.push(leftArr.shift()!);
      } else {
        sortedArray.push(rightArr.shift()!);
      }
    } else if (leftArr.length) {
      sortedArray.push(leftArr.shift()!);
    } else {
      sortedArray.push(rightArr.shift()!);
    }

    setTempItems([...sortedArray]);
    setActiveItems([...leftArr, ...rightArr]);
    setItems((prev) => {
      const sortedSubArray = [...sortedArray, ...leftArr, ...rightArr];
      const index = prev.findIndex((item) => sortedSubArray.includes(item));
      return [
        ...prev.slice(0, index),
        ...sortedSubArray,
        ...prev.slice(index + sortedSubArray.length),
      ];
    });
    await sleep(speedRef.current, signal);
    if (signal.aborted) return null;
  }

  setActiveItems([]);
  setTempItems([]);
  return sortedArray;
};

const mergeSort = async (
  arr: number[],
  config: SortConfig
): Promise<number[] | null> => {
  if (arr.length <= 1) return arr;

  const middleIndex = Math.floor(arr.length / 2);
  const leftArr = await mergeSort(arr.slice(0, middleIndex), config);
  if (leftArr === null) return null;
  const rightArr = await mergeSort(arr.slice(middleIndex), config);
  if (rightArr === null) return null;

  return merge(leftArr, rightArr, config);
};

export const useMergeSort = () => {
  const {
    items,
    setItems,
    setActiveItems,
    setTempItems,
    setDoneItems,
    speedRef,
  } = useStore();

  const sort = async (signal: AbortSignal) => {
    const sortedArray = await mergeSort([...items], {
      setItems,
      setActiveItems,
      setTempItems,
      speedRef,
      signal,
    });
    if (sortedArray !== null) {
      setItems(sortedArray);
      setDoneItems(sortedArray);
    }
    setActiveItems([]);
    setTempItems([]);
  };

  return sort;
};
