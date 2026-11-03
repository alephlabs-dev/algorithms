import { useStore } from "@/store";
import { sleep, swap } from "./utils";

export const useInsertionSort = () => {
  const insertionSort = async (signal: AbortSignal) => {
    const {
      setItems,
      setActiveItems,
      items,
      setDoneItems,
      speedRef,
      setTempItems,
    } = useStore.getState();
    const arr = [...items];
    let aborted = false;
    setTempItems([arr[0]]);

    outer: for (let i = 1; i < arr.length; i++) {
      const current = arr[i];

      // `current` moves left one slot per swap, so arr[j] is always the
      // next element of the sorted prefix to compare against.
      for (let j = i - 1; j >= 0; j--) {
        setActiveItems([current, arr[j]]);
        await sleep(speedRef.current, signal);
        if (signal.aborted) {
          aborted = true;
          break outer;
        }
        if (arr[j] > current) {
          swap(arr, j, j + 1);
          setItems([...arr]);
        } else {
          break;
        }
      }
      setTempItems((prev) => [...prev, current]);
    }

    setActiveItems([]);
    setTempItems([]);
    setDoneItems(aborted ? [] : arr);
  };

  return insertionSort;
};
