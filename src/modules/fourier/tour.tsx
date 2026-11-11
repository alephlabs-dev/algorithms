import { localized } from "@/i18n";
import type { TourStep } from "@/modules/types";

// The guided tour: which control to light up, and what to say about it.

export const fourierTour = localized<TourStep[]>({
  en: [
    {
      anchor: "picker",
      title: "Pick a series",
      text: () => "Three waves built from sines, or a drawing traced by circles on circles.",
    },
    {
      anchor: "bars",
      title: "The circles",
      text: () =>
        "Each circle turns at its own speed on the tip of the one before. The last tip draws: the wave on the right, or the shape.",
    },
    {
      anchor: "tools",
      phoneAnchor: "settings",
      title: "How many circles",
      text: ({ phone }) =>
        `${phone ? "In settings: the" : "The"} whole lesson. With one circle you get a plain sine; add more and corners sharpen, until the shape comes back.`,
    },
    {
      anchor: "play",
      title: "Play it",
      text: ({ wide }) =>
        `Watch it turn, or go a degree at a time with the buttons on either side.${wide ? " On a keyboard: Space, ← and →." : ""}`,
    },
    {
      anchor: "narration",
      title: "Follow along",
      text: ({ wide }) =>
        wide
          ? "The math it's running, and how close the circles are to the goal right now."
          : "How close the circles are to the goal right now. Tap it to see the math.",
    },
    {
      anchor: "settings",
      title: "Change it",
      text: () =>
        "Circles, and for drawings which one: shapes, constellations like the Southern Cross or Orion, a cat, the ℵ… or your own.",
    },
  ],
  es: [
    {
      anchor: "picker",
      title: "Elige una serie",
      text: () => "Tres ondas construidas con senos, o un dibujo trazado por círculos sobre círculos.",
    },
    {
      anchor: "bars",
      title: "Los círculos",
      text: () =>
        "Cada círculo gira a su propia velocidad en la punta del anterior. La última punta dibuja: la onda de la derecha, o la forma.",
    },
    {
      anchor: "tools",
      phoneAnchor: "settings",
      title: "Cuántos círculos",
      text: ({ phone }) =>
        `${phone ? "En los ajustes: toda" : "Toda"} la lección. Con un círculo obtienes un seno simple; agrega más y las esquinas se afilan, hasta que vuelve la forma.`,
    },
    {
      anchor: "play",
      title: "Reprodúcelo",
      text: ({ wide }) =>
        `Míralo girar, o avanza grado por grado con los botones de los costados.${wide ? " Con teclado: Espacio, ← y →." : ""}`,
    },
    {
      anchor: "narration",
      title: "Síguelo",
      text: ({ wide }) =>
        wide
          ? "Las cuentas que hace, y qué tan cerca están los círculos del objetivo en este momento."
          : "Qué tan cerca están los círculos del objetivo en este momento. Tócalo para ver las cuentas.",
    },
    {
      anchor: "settings",
      title: "Cámbialo",
      text: () =>
        "Los círculos y, para los dibujos, cuál: formas, constelaciones como la Cruz del Sur u Orión, un gato, la ℵ… o el tuyo.",
    },
  ],
});
