import { useStore } from "@/store";
import { sleep, swap } from "./utils";

export const useSelectionSort = () => {
  const sort = async (signal: AbortSignal) => {
    const { items, setItems, setActiveItems, setDoneItems, speedRef } =
      useStore.getState();
    const result = [...items];

    for (let i = 0; i < result.length - 1; i++) {
      let minIndex = i;
      for (let j = i + 1; j < result.length; j++) {
        setActiveItems([result[j], result[minIndex]]);
        await sleep(speedRef.current, signal);
        if (signal.aborted) {
          setActiveItems([]);
          setDoneItems([]);
          return;
        }
        if (result[j] < result[minIndex]) {
          minIndex = j;
        }
      }
      if (minIndex !== i) {
        swap(result, i, minIndex);
      }
      setItems([...result]);
      setDoneItems((prev) => [...prev, result[i]]);
    }

    setDoneItems((prev) => [...prev, result[result.length - 1]]);
    setActiveItems([]);
  };

  return sort;
};
