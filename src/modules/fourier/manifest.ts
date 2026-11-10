import { localized } from "@/i18n";
import type { ModuleManifest } from "@/routes";
import { fourierSeries } from "./algorithms";
import type { FourierAlgorithm } from "./types";

const text = localized({
  en: {
    title: "Fourier series",
    summary: "Square, sawtooth and triangle waves built from circles, and circles on circles that draw any shape.",
    count: (n: number) => `${n} series`,
    moduleTitle: "Fourier Series Visualizer: Waves and Drawings from Circles · Aleph Labs",
    moduleDescription:
      "Build a square, sawtooth or triangle wave from turning circles, or watch circles on circles retrace constellations, drawings or your own. See the fit improve with every circle.",
    epicyclesTitle: "Fourier Epicycles: Draw Any Shape with Circles · Aleph Labs",
    seriesTitle: (title: string) => `${title} Fourier Series, Visualized with Circles · Aleph Labs`,
    section: "Fourier series",
    about: "About Fourier series",
    howItWorks: ({ title }: { title: string; named: string }) => `How the ${title} works`,
  },
  es: {
    title: "Series de Fourier",
    summary: "Ondas cuadradas, de sierra y triangulares hechas con círculos, y círculos sobre círculos que dibujan cualquier forma.",
    count: (n) => `${n} series`,
    moduleTitle: "Visualizador de series de Fourier: ondas y dibujos hechos con círculos · Aleph Labs",
    moduleDescription:
      "Construye una onda cuadrada, de sierra o triangular con círculos que giran, o mira círculos sobre círculos volver a trazar constelaciones, dibujos o el tuyo. El ajuste mejora con cada círculo.",
    epicyclesTitle: "Epiciclos de Fourier: dibuja cualquier forma con círculos · Aleph Labs",
    seriesTitle: (title) => `${title}: serie de Fourier visualizada con círculos · Aleph Labs`,
    section: "Series de Fourier",
    about: "Sobre las series de Fourier",
    howItWorks: ({ named }) => `${/^l(o|a)s /.test(named) ? "Cómo funcionan" : "Cómo funciona"} ${named}`,
  },
});

/** Fourier's pages, what search engines and hints say on them, and its landing card. */
export const fourierManifest = {
  pages: {
    base: "/fourier",
    slugs: {
      square: "square-wave",
      sawtooth: "sawtooth-wave",
      triangle: "triangle-wave",
      epicycles: "epicycles",
    },
    race: false,
  },
  translated: true,
  landing: { title: text.title, summary: text.summary, count: text.count(Object.keys(fourierSeries).length) },
  seo: {
    section: text.section,
    start: { title: text.moduleTitle, description: text.moduleDescription },
    algorithm: (algorithm: FourierAlgorithm) => {
      const { title, shortDescription } = fourierSeries[algorithm];
      return {
        title: algorithm === "epicycles" ? text.epicyclesTitle : text.seriesTitle(title),
        description: shortDescription.slice(0, 200),
        crumb: title,
      };
    },
  },
  hints: {
    start: text.about,
    algorithm: (algorithm: FourierAlgorithm) => text.howItWorks(fourierSeries[algorithm]),
  },
  example: {
    algorithm: "epicycles",
    search:
      "?circles=25&shape=custom&path=RkZQRllGYkZrRnRGfUaGRo9GmUaiRqtGtEa9RsZGz0bYRuJG60bwSOlP41XdW9Zi0GjJb8N1vHy2gq-JqY-ilpyclqKPqYmvgrZ8vHXDb8lo0GLWW91V40_pSPBG60biRthGz0bGRr1GtEarRqJGmUaPRoZGfUZ0RmtGYkZZRlA&speed=2x",
  },
} as const satisfies ModuleManifest<FourierAlgorithm>;
