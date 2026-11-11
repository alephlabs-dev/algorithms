import { Explanation, Section } from "@/components/Article";
import { articleText } from "@/components/articleText";
import { PageLink } from "@/components/PageLink";
import { localized } from "@/i18n";
import type { Nav } from "@/modules/types";
import { fourierSeries } from "./algorithms";
import { fourierPseudocode } from "./pseudocode";
import type { FourierAlgorithm } from "./types";

const fourierText = localized({
  en: {
    moduleTitle: "Fourier series",
    moduleIntro:
      "Any repeating wave, and any closed drawing, can be built from circles turning at whole-number speeds. Watch them add up, and see how the fit improves with every circle you add.",
    all: "All series",
    whyCircles: "Why circles?",
    whyText:
      "A circle turning at a steady speed is the simplest repeating motion there is, and its height over time is a sine. Joseph Fourier showed in 1807 that repeating signals can be written as sums of sines; stacking each one as a circle on the tip of the last turns that sum into something you can watch. The same idea is behind JPEG images, MP3 audio and how phones tell voices apart.",
    howItWorks: "How it works",
    theSeries: "The series",
    more: "More series",
  },
  es: {
    moduleTitle: "Series de Fourier",
    moduleIntro:
      "Cualquier onda que se repite, y cualquier dibujo cerrado, se puede construir con círculos que giran a velocidades enteras. Mira cómo se suman y cómo el ajuste mejora con cada círculo que agregas.",
    all: "Todas las series",
    whyCircles: "¿Por qué círculos?",
    whyText:
      "Un círculo que gira a velocidad constante es el movimiento repetitivo más simple que existe, y su altura a lo largo del tiempo es un seno. Joseph Fourier mostró en 1807 que las señales que se repiten se pueden escribir como sumas de senos; apilar cada uno como un círculo en la punta del anterior convierte esa suma en algo que se puede ver. La misma idea está detrás de las imágenes JPEG, el audio MP3 y la forma en que los teléfonos distinguen voces.",
    howItWorks: "Cómo funciona",
    theSeries: "La serie",
    more: "Más series",
  },
});

const seriesOrder = Object.keys(fourierSeries) as FourierAlgorithm[];

export const FourierArticle = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{fourierText.moduleTitle}</h1>
      <p className="text-lg text-foreground/80">{fourierText.moduleIntro}</p>
    </header>
    <Section title={fourierText.all}>
      <ul className="tap-rows flex flex-col divide-y divide-edge">
        {seriesOrder.map((algorithm) => (
          <li key={algorithm} className="flex flex-col gap-1 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <PageLink to={{ module: "fourier", page: "algorithm", algorithm }} onNavigate={onNavigate}>
                {fourierSeries[algorithm].title}
              </PageLink>
              <span className="font-mono text-xs text-foreground/60">{fourierSeries[algorithm].speeds}</span>
            </div>
            <p className="text-sm text-foreground/75">{fourierSeries[algorithm].shortDescription}</p>
          </li>
        ))}
      </ul>
    </Section>
    <Explanation title={fourierText.whyCircles}>
      <p className="leading-relaxed text-foreground/80">{fourierText.whyText}</p>
    </Explanation>
  </>
);

export const SeriesArticle = ({ algorithm, onNavigate }: { algorithm: FourierAlgorithm; onNavigate?: Nav["onNavigate"] }) => {
  const { title, shortDescription, longDescription, formula } = fourierSeries[algorithm];
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Explanation title={fourierText.howItWorks}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Explanation>
      <Section title={fourierText.theSeries}>
        <p className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[15px]">{formula}</p>
      </Section>
      <Explanation title={articleText.pseudocode}>
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {fourierPseudocode[algorithm].join("\n")}
        </pre>
      </Explanation>
      <Section title={fourierText.more}>
        <ul className="tap-rows flex flex-wrap gap-x-6 gap-y-2">
          {seriesOrder.map((other) => (
            <li key={other}>
              {other === algorithm ? (
                <span className="font-semibold">{fourierSeries[other].title}</span>
              ) : (
                <PageLink to={{ module: "fourier", page: "algorithm", algorithm: other }} onNavigate={onNavigate}>
                  {fourierSeries[other].title}
                </PageLink>
              )}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
};

