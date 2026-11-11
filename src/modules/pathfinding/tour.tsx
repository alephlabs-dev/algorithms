import { localized } from "@/i18n";
import { Swatch } from "@/components/TourSwatch";
import { colorNames } from "@/components/tourColors";
import { MUD_COST } from "./types";
import type { TourStep } from "@/modules/types";

// The guided tour: which control to light up, and what to say about it.

export const pathfindingTour = localized<TourStep[]>({
  en: [
    {
      anchor: "picker",
      title: "Pick a search",
      text: () => "Five ways to get from start to target. Some find the shortest path, some just find one.",
    },
    {
      anchor: "bars",
      title: "The grid",
      text: () => (
        <>
          Get from the <Swatch className="bg-primary" />
          start to the <Swatch className="ml-1 bg-background ring-2 ring-foreground" />
          target. Drag across the grid to draw walls, and drag either one to move it.
        </>
      ),
    },
    {
      anchor: "tools",
      phoneAnchor: "settings",
      title: "Walls, mud and layouts",
      text: ({ phone }) =>
        `${phone ? "In settings: switch" : "Switch"} the brush to mud: it can be crossed, but each step on it costs ${MUD_COST}. Or start from a maze, random walls or rough terrain.`,
    },
    {
      anchor: "play",
      title: "Play it",
      text: ({ wide }) =>
        `Watch the search spread, or go one step at a time with the buttons on either side.${wide ? " On a keyboard: Space, ← and →." : ""}`,
    },
    {
      anchor: "narration",
      title: "Follow the search",
      text: ({ theme, wide }) => (
        <>
          <Swatch className="bg-secondary" />
          {colorNames[theme].comparing} cells are waiting to be explored, faded ones are done, and the{" "}
          <Swatch className="bg-primary" />
          {colorNames[theme].done} line is the path.{" "}
          {wide ? "Here: the code it's running and what just happened." : "Tap here to see the code it's running."}
        </>
      ),
    },
    {
      anchor: "settings",
      title: "Change the grid",
      text: () => "A smaller grid to read along, or a bigger one to see how each search spreads.",
    },
    {
      anchor: "game",
      title: "A guessing game",
      text: () =>
        "Turn on Guess and playback stops to ask which of four lettered cells the search visits next: each search picks its own way. It keeps score.",
    },
  ],
  es: [
    {
      anchor: "picker",
      title: "Elige una búsqueda",
      text: () => "Cinco formas de ir del inicio al destino. Algunas encuentran el camino más corto; otras, solo alguno.",
    },
    {
      anchor: "bars",
      title: "La cuadrícula",
      text: () => (
        <>
          Ve del <Swatch className="bg-primary" />
          inicio al <Swatch className="ml-1 bg-background ring-2 ring-foreground" />
          destino. Arrastra sobre la cuadrícula para dibujar paredes, y arrastra cualquiera de los dos para moverlo.
        </>
      ),
    },
    {
      anchor: "tools",
      phoneAnchor: "settings",
      title: "Paredes, barro y disposiciones",
      text: ({ phone }) =>
        `${phone ? "En los ajustes, cambia" : "Cambia"} el pincel a barro: se puede cruzar, pero cada paso sobre él cuesta ${MUD_COST}. O empieza con un laberinto, paredes al azar o terreno irregular.`,
    },
    {
      anchor: "play",
      title: "Reprodúcelo",
      text: ({ wide }) =>
        `Mira cómo se expande la búsqueda, o avanza paso a paso con los botones de los costados.${wide ? " Con teclado: Espacio, ← y →." : ""}`,
    },
    {
      anchor: "narration",
      title: "Sigue la búsqueda",
      text: ({ theme, wide }) => (
        <>
          Las <Swatch className="bg-secondary" />
          celdas {colorNames[theme].comparing} esperan a ser exploradas, las atenuadas ya se exploraron y la{" "}
          <Swatch className="bg-primary" />
          línea {theme === "dark" ? "verde" : "turquesa"} es el camino.{" "}
          {wide ? "Aquí: el código que ejecuta y lo que acaba de pasar." : "Toca aquí para ver el código que ejecuta."}
        </>
      ),
    },
    {
      anchor: "settings",
      title: "Cambia la cuadrícula",
      text: () => "Una cuadrícula más pequeña para seguirla de cerca, o una más grande para ver cómo se expande cada búsqueda.",
    },
    {
      anchor: "game",
      title: "Un juego de adivinar",
      text: () =>
        "Activa Adivina y la reproducción se detiene para preguntarte cuál de cuatro celdas con letra visita la búsqueda ahora: cada búsqueda elige a su manera. Lleva el puntaje.",
    },
  ],
});
