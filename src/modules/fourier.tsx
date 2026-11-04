import { FourierStage } from "@/components/Fourier/FourierStage";
import { FourierFacts, FourierLegend, FourierStatsInline, FourierTools } from "@/components/Fourier/FourierTools";
import { FourierSettings } from "@/components/Settings/SettingsPanel";
import { fourierSeries, shapeLabel } from "@/consts/fourierSeries";
import { fourierPseudocode, isWave, type FourierAlgorithm } from "@/fourier";
import { useStore } from "@/store";
import { count } from "@/utils/count";
import { narrateFourier } from "@/utils/narrateFourier";
import { fourierTour } from "./tours";
import type { ModuleUI } from "./types";

export const fourierUI: ModuleUI = {
  id: "fourier",
  title: "Fourier",

  Stage: FourierStage,
  // How many circles is the whole lesson, so it sits right above the stage.
  Tools: FourierTools,
  Legend: FourierLegend,
  Stats: FourierStatsInline,
  Settings: FourierSettings,
  Facts: FourierFacts,

  settingsSummary: (s) => {
    const circles = String(s.fourierCircles);
    const detail = isWave(s.fourierAlgorithm) ? "circles" : shapeLabel(s.fourierShape);
    return {
      main: circles,
      detail,
      mono: true,
      label: isWave(s.fourierAlgorithm)
        ? count(s.fourierCircles, "circle")
        : `${count(s.fourierCircles, "circle")}, ${detail}`,
    };
  },
  // A frame per degree of the slowest circle.
  progress: (index, last) => `${index}° / ${last}°`,
  newRunLabel: "More circles",

  algorithms: [
    {
      label: "Waves",
      hint: "sines in a row",
      items: (["square", "sawtooth", "triangle"] as FourierAlgorithm[]).map((id) => ({
        id,
        title: fourierSeries[id].title,
        short: fourierSeries[id].short,
      })),
    },
    {
      label: "Drawings",
      hint: "circles in 2D",
      items: [{ id: "epicycles", title: fourierSeries.epicycles.title, short: fourierSeries.epicycles.short }],
    },
  ],
  current: (s) => s.fourierAlgorithm,
  pick: (id) => useStore.getState().setFourierAlgorithm(id as FourierAlgorithm),

  about: (s) => fourierSeries[s.fourierAlgorithm],
  summary: (s) => `${count(s.fourierCircles, "circle")} · off by ${(s.fourierRun.error * 100).toFixed(1)}%`,

  code: {
    lines: (s) => fourierPseudocode[s.fourierAlgorithm],
    // Before playing: the setup (the transform, for drawings). Then: drawing, frame after frame.
    line: (s) => (s.frameIndex === 0 ? (isWave(s.fourierAlgorithm) ? 0 : 2) : 6),
    narrate: (s, index) => narrateFourier(s.fourierRun, Math.min(index, s.fourierRun.length - 1)),
  },

  tour: fourierTour,
};
