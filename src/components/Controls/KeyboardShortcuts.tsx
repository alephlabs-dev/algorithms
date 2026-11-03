import { useEffect } from "react";
import { useStore } from "@/store";

const isTextField = (el: Element) =>
  el instanceof HTMLInputElement ||
  el instanceof HTMLTextAreaElement ||
  (el as HTMLElement).isContentEditable;

/**
 * Space: play/pause · ←/→: step · R: new array.
 * Renders nothing, and reads the store on keypress so it never re-renders.
 */
export const KeyboardShortcuts = () => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as Element;
      if (isTextField(target)) return;
      // Sliders already use the arrow keys.
      const onSlider = target.getAttribute("role") === "slider";
      // A focused button already activates on Space; don't toggle twice.
      const onButton = target instanceof HTMLButtonElement;

      const state = useStore.getState();
      switch (event.key) {
        case " ":
          if (onButton || onSlider) return;
          event.preventDefault(); // don't scroll the page
          if (state.isPlaying) state.pause();
          else state.play();
          break;
        case "ArrowLeft":
          if (onSlider) return;
          event.preventDefault();
          state.stepBackward();
          break;
        case "ArrowRight":
          if (onSlider) return;
          event.preventDefault();
          state.stepForward();
          break;
        case "r":
        case "R":
          if (!state.isPlaying) state.createNewArray();
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
};
