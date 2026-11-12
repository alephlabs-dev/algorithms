import { useEffect } from "react";
import { selectLastIndex, useStore } from "@/store";
import { engines } from "@/modules/engine";
import { selectSpeed } from "@/store";
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
      const state = useStore.getState();
      pending += now - last;
      last = now;
      const delay = stepDelay(selectSpeed(state));
      const lastIndex = selectLastIndex(state);

      // Each step costs its share of a beat (see STEP_WEIGHT). Races tick once per
      // operation or cell examined, the same for every lane, so they stay uniform.
      const costOf = (index: number) =>
        state.view === "race" ? delay : delay * engines[state.module].stepWeight(state, index);

      let steps = 0;
      while (steps < MAX_STEPS_PER_FRAME && state.frameIndex + steps < lastIndex) {
        const cost = costOf(state.frameIndex + steps + 1);
        if (pending < cost) break;
        pending -= cost;
        steps++;
      }
      if (steps === MAX_STEPS_PER_FRAME) pending = 0;
      if (steps > 0) state.advanceBy(steps);
      request = requestAnimationFrame(loop);
    };
    request = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(request);
  }, [isPlaying]);

  return null;
};
