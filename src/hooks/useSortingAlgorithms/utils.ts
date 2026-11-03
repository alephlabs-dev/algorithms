import { StoreState } from "@/store";

// Resolves after `delay` ms, or right away if the signal is aborted,
// so pressing Stop doesn't have to wait for the current step to finish.
export const sleep = (delay: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal.aborted) return resolve();
    const done = () => {
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", done);
      resolve();
    };
    const timeoutId = setTimeout(done, delay);
    signal.addEventListener("abort", done, { once: true });
  });

export const swap = (arr: number[], i: number, j: number) => {
  [arr[i], arr[j]] = [arr[j], arr[i]];
};

export const markAsDone = (
  num: number,
  setDoneItems: StoreState["setDoneItems"]
) => {
  setDoneItems((prev) => [...prev, num]);
};
