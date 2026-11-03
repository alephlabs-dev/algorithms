import { useEffect } from "react";
import { useStore } from "@/store";
import { stepDelay } from "@/utils/speed";

// Cap so a slow frame (tab in background, big seek) can't jump half the run at once.
const MAX_STEPS_PER_FRAME = 200;

// Advances the run while playing. At high speeds several steps pass per animation
// frame. Renders nothing and reads the store directly, so ticking never re-renders it.
export const Playback = () => {
  const isPlaying = useStore((s) => s.isPlaying);

  useEffect(() => {
    if (!isPlaying) return;
    let request = 0;
    let last = performance.now();
    let pending = 0; // ms accumulated towards the next step

    const loop = (now: number) => {
      const { speed, advanceBy } = useStore.getState();
      pending += now - last;
      last = now;
      const delay = stepDelay(speed);
      const steps = Math.floor(pending / delay);
      if (steps > 0) {
        pending = steps > MAX_STEPS_PER_FRAME ? 0 : pending - steps * delay;
        advanceBy(Math.min(steps, MAX_STEPS_PER_FRAME));
      }
      request = requestAnimationFrame(loop);
    };
    request = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(request);
  }, [isPlaying]);

  return null;
};
