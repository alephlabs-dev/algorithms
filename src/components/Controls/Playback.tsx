import { useEffect } from "react";
import { selectLastIndex, useStore } from "@/store";
import { PATH_STEP_WEIGHT, STEP_WEIGHT, stepDelay } from "@/utils/speed";

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
      const delay = stepDelay(state.speed);
      const lastIndex = selectLastIndex(state);

      // Each step costs its share of a beat (see STEP_WEIGHT). Races run on an
      // operation clock where every tick is one operation, so they stay uniform.
      const costOf = (index: number) => {
        if (state.module === "pathfinding") return delay * PATH_STEP_WEIGHT[state.pathTimeline.stepAt(index)?.type ?? "done"];
        return state.view === "race" ? delay : delay * STEP_WEIGHT[state.timeline.kindAt(index) ?? "finish"];
      };

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
