import { localized } from "@/i18n";
import { Swatch } from "@/components/TourSwatch";
import { colorNames } from "@/components/tourColors";
import { sortGuessSizes } from "./slice";
import type { TourStep } from "@/modules/types";

// The guided tour: which control to light up, and what to say about it.

export const sortingTour = localized<TourStep[]>({
  en: [
    {
      anchor: "picker",
      title: "Pick an algorithm",
      text: () => "Nine of them, grouped by how well they cope with bigger arrays.",
    },
    {
      anchor: "bars",
      title: "The array",
      text: ({ theme }) => (
        <>
          Each bar is a number. <Swatch className="bg-secondary" />
          {colorNames[theme].comparing} bars are being compared; <Swatch className="bg-primary" />
          {colorNames[theme].done} ones are already in their final place.
        </>
      ),
    },
    {
      anchor: "play",
      title: "Play it",
      text: ({ wide }) =>
        `Watch it sort, or go one step at a time with the buttons on either side.${wide ? " On a keyboard: Space, ← and →." : ""}`,
    },
    {
      anchor: "narration",
      title: "Follow each step",
      text: ({ wide }) =>
        wide
          ? "The code it's running, with the current line lit up, and what just happened in plain words."
          : "What just happened, in plain words. Tap it to see the code.",
    },
    {
      anchor: "speed",
      title: "Set the pace",
      text: () => "1× is tuned to the size of the array. Go slower to read along, or faster to see the big picture.",
    },
    {
      anchor: "settings",
      title: "Change the array",
      text: () => "How many items, how they start out (random, reversed, nearly sorted…), and bars or numbers.",
    },
    {
      anchor: "game",
      title: "A guessing game",
      text: () =>
        `Turn on Guess and playback stops before the key moments to ask what comes next. Answer, then watch whether you were right. It keeps score. For now it plays with ${sortGuessSizes} items, and not every algorithm asks yet.`,
    },
    {
      anchor: "race",
      title: "Race them",
      text: () => "Run up to four algorithms on the same array, side by side, and see which one does the least work.",
    },
  ],
  es: [
    {
      anchor: "picker",
      title: "Elige un algoritmo",
      text: () => "Son nueve, agrupados según qué tan bien manejan arreglos grandes.",
    },
    {
      anchor: "bars",
      title: "El arreglo",
      text: ({ theme }) => (
        <>
          Cada barra es un número. Las barras <Swatch className="bg-secondary" />
          {colorNames[theme].comparing} se están comparando; las <Swatch className="bg-primary" />
          {colorNames[theme].done} ya están en su lugar final.
        </>
      ),
    },
    {
      anchor: "play",
      title: "Reprodúcelo",
      text: ({ wide }) =>
        `Míralo ordenar, o avanza paso a paso con los botones de cada lado.${wide ? " Con teclado: Espacio, ← y →." : ""}`,
    },
    {
      anchor: "narration",
      title: "Sigue cada paso",
      text: ({ wide }) =>
        wide
          ? "El código que ejecuta, con la línea actual resaltada, y lo que acaba de pasar en palabras simples."
          : "Lo que acaba de pasar, en palabras simples. Tócalo para ver el código.",
    },
    {
      anchor: "speed",
      title: "Elige el ritmo",
      text: () =>
        "1× se ajusta al tamaño del arreglo. Ve más lento para seguirlo, o más rápido para ver el panorama completo.",
    },
    {
      anchor: "settings",
      title: "Cambia el arreglo",
      text: () =>
        "Cuántos elementos, cómo empiezan (aleatorio, invertido, casi ordenado…), y barras o números.",
    },
    {
      anchor: "game",
      title: "Un juego de adivinanzas",
      text: () =>
        `Activa Adivina y la reproducción se detiene antes de los momentos clave para preguntarte qué sigue. Responde y mira si acertaste. Lleva el puntaje. Por ahora funciona con ${sortGuessSizes} elementos, y no todos los algoritmos preguntan todavía.`,
    },
    {
      anchor: "race",
      title: "Ponlos a competir",
      text: () =>
        "Ejecuta hasta cuatro algoritmos sobre el mismo arreglo, lado a lado, y mira cuál trabaja menos.",
    },
  ],
});
