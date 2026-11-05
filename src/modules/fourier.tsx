import { FourierStage } from "@/components/Fourier/FourierStage";
import { FourierFacts, FourierLegend, FourierStatsInline, FourierTools } from "@/components/Fourier/FourierTools";
import { FourierSettings } from "@/components/Settings/SettingsPanel";
import { fourierSeries, shapeLabel } from "@/consts/fourierSeries";
import { fourierPseudocode, isWave, type FourierAlgorithm } from "@/fourier";
import { localized } from "@/i18n";
import { useStore } from "@/store";
import { count } from "@/utils/count";
import { narrateFourier } from "@/utils/narrateFourier";
import { fourierTour } from "./tours";
import type { ModuleUI } from "./types";

const text = localized({
  en: {
    title: "Fourier",
    circlesWord: "circles",
    circles: (n: number) => count(n, "circle"),
    newRun: "More circles",
    waves: "Waves",
    sines: "sines in a row",
    drawings: "Drawings",
    in2d: "circles in 2D",
    summary: (n: number, error: string) => `${count(n, "circle")} · off by ${error}%`,
  },
  es: {
    title: "Fourier",
    circlesWord: "círculos",
    circles: (n) => `${n} ${n === 1 ? "círculo" : "círculos"}`,
    newRun: "Más círculos",
    waves: "Ondas",
    sines: "senos en fila",
    drawings: "Dibujos",
    in2d: "círculos en 2D",
    summary: (n, error) => `${n} ${n === 1 ? "círculo" : "círculos"} · error ${error}%`,
  },
});

export const fourierUI: ModuleUI = {
  id: "fourier",
  title: text.title,

  Stage: FourierStage,
  // How many circles is the whole lesson, so it sits right above the stage.
  Tools: FourierTools,
  Legend: FourierLegend,
  Stats: FourierStatsInline,
  Settings: FourierSettings,
  Facts: FourierFacts,

  settingsSummary: (s) => {
    const circles = String(s.fourierCircles);
    const detail = isWave(s.fourierAlgorithm) ? text.circlesWord : shapeLabel(s.fourierShape);
    return {
      main: circles,
      detail,
      mono: true,
      label: isWave(s.fourierAlgorithm)
        ? text.circles(s.fourierCircles)
        : `${text.circles(s.fourierCircles)}, ${detail}`,
    };
  },
  // A frame per degree of the slowest circle.
  progress: (index, last) => `${index}° / ${last}°`,
  newRunLabel: text.newRun,

  algorithms: [
    {
      label: text.waves,
      hint: text.sines,
      items: (["square", "sawtooth", "triangle"] as FourierAlgorithm[]).map((id) => ({
        id,
        title: fourierSeries[id].title,
        short: fourierSeries[id].short,
      })),
    },
    {
      label: text.drawings,
      hint: text.in2d,
      items: [{ id: "epicycles", title: fourierSeries.epicycles.title, short: fourierSeries.epicycles.short }],
    },
  ],
  current: (s) => s.fourierAlgorithm,
  pick: (id) => useStore.getState().setFourierAlgorithm(id as FourierAlgorithm),

  about: (s) => fourierSeries[s.fourierAlgorithm],
  summary: (s) => text.summary(s.fourierCircles, (s.fourierRun.error * 100).toFixed(1)),

  code: {
    lines: (s) => fourierPseudocode[s.fourierAlgorithm],
    // Before playing: the setup (the transform, for drawings). Then: drawing, frame after frame.
    line: (s) => (s.frameIndex === 0 ? (isWave(s.fourierAlgorithm) ? 0 : 2) : 6),
    narrate: (s, index) => narrateFourier(s.fourierRun, Math.min(index, s.fourierRun.length - 1)),
  },

  tour: fourierTour,
};
