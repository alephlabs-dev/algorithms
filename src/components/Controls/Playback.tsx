import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";

// Advances one frame per `speed` ms while playing. Renders nothing; it lives in
// its own component so ticking doesn't re-render the controls.
export const Playback = () => {
  const { isPlaying, frameIndex, advance } = useStore(
    useShallow((s) => ({
      isPlaying: s.isPlaying,
      frameIndex: s.frameIndex,
      advance: s.advance,
    }))
  );

  useEffect(() => {
    if (!isPlaying) return;
    // Read speed when scheduling so dragging the slider doesn't restart the timer.
    const timeoutId = setTimeout(advance, useStore.getState().speed);
    return () => clearTimeout(timeoutId);
  }, [isPlaying, frameIndex, advance]);

  return null;
};
