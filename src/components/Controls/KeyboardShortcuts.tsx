import { useEffect } from "react";
import { useStore } from "@/store";

const isTextField = (el: Element | null) =>
  el instanceof HTMLInputElement ||
  el instanceof HTMLTextAreaElement ||
  (el instanceof HTMLElement && el.isContentEditable);

/**
 * Space: play/pause · ←/→: step · R: new array · ?: help.
 * Renders nothing, and reads the store on keypress so it never re-renders.
 */
export const KeyboardShortcuts = () => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // While the help dialog is open only "?" (to close it) applies.
      if (useStore.getState().isHelpOpen && event.key !== "?") return;
      // Events dispatched on document/window have no element target.
      const target = event.target instanceof Element ? event.target : null;
      if (isTextField(target)) return;
      // Sliders and radio groups (segmented controls) already use the arrow keys.
      const role = target?.getAttribute("role");
      const onSlider = role === "slider" || role === "radio";
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
        case "?":
          event.preventDefault();
          state.setHelpOpen(!state.isHelpOpen);
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
