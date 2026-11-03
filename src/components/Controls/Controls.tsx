import { useEffect, useRef } from "react";
import { PauseIcon, PlayIcon, UpdateIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

import { useSortingAlgorithms } from "@/hooks/useSortingAlgorithms";
import { useStore } from "@/store";
import { SpeedSlider } from "./SpeedSlider";

import type { Algorithm } from "@/types";

export const Controls = () => {
  const {
    isPlaying,
    activeAlgorithm,
    createNewArray,
    setIsPlaying,
    doneItems,
    items,
  } = useStore();
  const { selectionSort, bubbleSort, quickSort, insertionSort, mergeSort } =
    useSortingAlgorithms();
  // One controller per run, so a stopped run can never be confused with a new one.
  const abortControllerRef = useRef<AbortController | null>(null);

  const handlePlayAnimation = async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsPlaying(true);
    const algorithmMap: Record<Algorithm, (signal: AbortSignal) => Promise<void>> = {
      selection: selectionSort,
      bubble: bubbleSort,
      quick: quickSort,
      insertion: insertionSort,
      merge: mergeSort,
    };
    try {
      await algorithmMap[activeAlgorithm](controller.signal);
    } finally {
      // Only unlock the UI once the sort has really stopped writing to the store.
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsPlaying(false);
      }
    }
  };

  const handleStopAnimation = () => {
    abortControllerRef.current?.abort();
  };

  // Stop any running sort if the controls unmount.
  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const isDone = doneItems.length === items.length;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-4">
      <SpeedSlider />
      <div className="flex items-center gap-4 w-full lg:w-auto">
        <Button
          variant="ghost"
          className="bg-background border-2 border-accent hover:bg-accent text-base text-foreground hover:text-foreground h-auto px-4 py-2 w-full lg:w-48"
          onClick={isPlaying ? handleStopAnimation : handlePlayAnimation}
          disabled={!isPlaying && isDone}
        >
          {isPlaying ? (
            <PauseIcon className="h-4 w-4 mr-2" />
          ) : (
            <PlayIcon className="h-4 w-4 mr-2" />
          )}
          {isPlaying ? "Stop" : "Play"}
        </Button>

        <Button
          variant="ghost"
          className="bg-background border-2 border-accent hover:bg-accent text-base text-foreground hover:text-foreground h-auto px-4 py-2 w-full lg:w-48"
          onClick={createNewArray}
          disabled={isPlaying}
        >
          <UpdateIcon className="h-4 w-4 mr-2" /> Reset
        </Button>
      </div>
    </div>
  );
};
