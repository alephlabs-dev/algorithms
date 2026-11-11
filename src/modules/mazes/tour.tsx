import type { ReactNode } from "react";
import { localized } from "@/i18n";
import { useStore, type Theme } from "@/store";
import { Swatch } from "@/components/TourSwatch";
import { colorNames } from "@/components/tourColors";
import { hasStartCell } from "./generators";
import type { MazeAlgorithm } from "./types";
import type { TourStep } from "@/modules/types";

// The guided tour: which control to light up, and what to say about it.

/** The colors only show once carving is under way: a run still at its first frame moves a third in. */
const carveAThird = () => {
  const { frameIndex, mazes, seek } = useStore.getState();
  if (frameIndex === 0) seek(Math.floor(mazes.run.length / 3));
};

// The move each frame is the outline color, named in the singular ("la blanca").
const activeColor = localized<Record<Theme, string>>({
  en: { dark: "white", light: "navy" },
  es: { dark: "blanca", light: "azul marino" },
});

// Kruskal's two regions: the secondary and primary colors, named in the singular ("la región morada").
const regionColors = localized<Record<Theme, { region: string; other: string }>>({
  en: { dark: { region: "purple", other: "green" }, light: { region: "orange", other: "teal" } },
  es: { dark: { region: "morada", other: "verde" }, light: { region: "naranja", other: "turquesa" } },
});

/** What the colors only one generator shows mean, before the dead ends every one of them marks. */
const mazeTones = localized<Record<MazeAlgorithm, (theme: Theme) => ReactNode>>({
  en: {
    dfs: (theme) => (
      <>
        <Swatch className="bg-secondary" />
        {colorNames[theme].comparing} cells are on the stack: the way back it can still take.
      </>
    ),
    prim: (theme) => (
      <>
        <Swatch className="bg-secondary" />
        {colorNames[theme].comparing} cells are the frontier: where the maze can grow next. The{" "}
        <Swatch className="bg-outline" />
        {activeColor[theme]} cell was just picked, with the wall it joined through.
      </>
    ),
    kruskal: (theme) => (
      <>
        A <Swatch className="bg-outline" />
        {activeColor[theme]} wall is carved: it joins the <Swatch className="bg-secondary" />
        {regionColors[theme].region} region on one side to the <Swatch className="bg-primary" />
        {regionColors[theme].other} one on the other. A <Swatch className="bg-conflict" cross />
        red, crossed-out wall is skipped: both its sides are in one region already, so carving it would close a loop.
      </>
    ),
    wilson: (theme) => (
      <>
        <Swatch className="bg-secondary" />
        {colorNames[theme].comparing} cells are the random walk, not in the maze until it gets there. The{" "}
        <Swatch className="bg-outline" />
        {activeColor[theme]} one is its last step.
      </>
    ),
  },
  es: {
    dfs: (theme) => (
      <>
        Las <Swatch className="bg-secondary" />
        celdas {colorNames[theme].comparing} están en la pila: el camino de vuelta que aún puede tomar.
      </>
    ),
    prim: (theme) => (
      <>
        Las <Swatch className="bg-secondary" />
        celdas {colorNames[theme].comparing} son la frontera: por donde el laberinto puede crecer. La{" "}
        <Swatch className="bg-outline" />
        {activeColor[theme]} es la que acaba de elegir, con la pared por la que se unió.
      </>
    ),
    kruskal: (theme) => (
      <>
        Una pared <Swatch className="bg-outline" />
        {activeColor[theme]} se excava: une la región <Swatch className="bg-secondary" />
        {regionColors[theme].region} de un lado con la <Swatch className="bg-primary" />
        {regionColors[theme].other} del otro. Una pared <Swatch className="bg-conflict" cross />
        roja y tachada se omite: sus dos lados ya están en la misma región, así que excavarla cerraría un ciclo.
      </>
    ),
    wilson: (theme) => (
      <>
        Las <Swatch className="bg-secondary" />
        celdas {colorNames[theme].comparing} son la caminata al azar, que no está en el laberinto hasta llegar a él.
        La <Swatch className="bg-outline" />
        {activeColor[theme]} es su último paso.
      </>
    ),
  },
});
const mazeTonesNow = (theme: Theme) => mazeTones[useStore.getState().mazes.algorithm](theme);
/** Whether the generator on stage grows from a start cell (Kruskal doesn't). */
const startsNow = () => hasStartCell[useStore.getState().mazes.algorithm];

// Dead-end cells are the tertiary color; mazes are the only tour that names it.
const deadEndColor = localized<Record<Theme, string>>({
  en: { dark: "Yellow", light: "Blue" },
  es: { dark: "amarillas", light: "azules" },
});

export const mazesTour = localized<TourStep[]>({
  en: [
    {
      anchor: "bars",
      title: "The grid",
      text: () => (
        <>
          Every cell starts walled in. The algorithm carves passages{" "}
          {startsNow() && (
            <>
              from the <Swatch className="bg-primary" />
              start{" "}
            </>
          )}
          until every cell is joined, with exactly one route between any two.
        </>
      ),
    },
    {
      anchor: "picker",
      title: "The algorithm",
      text: () =>
        "Randomized depth-first search, or Prim's, Kruskal's or Wilson's algorithm. More ways to carve a maze are on their way.",
    },
    {
      anchor: "legend",
      phoneAnchor: "bars",
      prepare: carveAThird,
      title: "What the colors mean",
      text: ({ theme }) => (
        <>
          {mazeTonesNow(theme)} At the end, <Swatch className="bg-tertiary" />
          {deadEndColor[theme].toLowerCase()} ones are dead-end cells.
        </>
      ),
    },
    {
      anchor: "play",
      title: "Play it",
      text: ({ wide }) =>
        `Watch it carve one decision at a time, or step with the buttons on either side.${wide ? " On a keyboard: Space, ← and →." : ""}`,
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
      anchor: "stats",
      title: "Steps and dead-end cells",
      text: () => "How many decisions it took, and once it's done, how many dead-end cells the maze has: its texture in a number.",
    },
    {
      anchor: "settings",
      title: "Pick a size",
      text: () => "A small maze to read along, or a large one to see its texture.",
    },
    {
      anchor: "new",
      title: "A new maze",
      text: () => "Another random maze of the same size. Share the link to show someone this exact one.",
    },
    {
      anchor: "race",
      title: "Side by side",
      text: () =>
        "Carve the same seed with up to four generators at once. There's no winner: compare their dead-end cells to see each texture.",
    },
  ],
  es: [
    {
      anchor: "bars",
      title: "La cuadrícula",
      text: () => (
        <>
          Todas las celdas empiezan amuralladas. El algoritmo excava pasillos{" "}
          {startsNow() && (
            <>
              desde el <Swatch className="bg-primary" />
              inicio{" "}
            </>
          )}
          hasta unir todas las celdas, con un único camino entre dos cualesquiera.
        </>
      ),
    },
    {
      anchor: "picker",
      title: "El algoritmo",
      text: () =>
        "La búsqueda en profundidad aleatoria, los algoritmos de Prim y Kruskal aleatorios o el de Wilson. Pronto habrá más formas de excavar un laberinto.",
    },
    {
      anchor: "legend",
      phoneAnchor: "bars",
      prepare: carveAThird,
      title: "Qué significa cada color",
      text: ({ theme }) => (
        <>
          {mazeTonesNow(theme)} Al final, las <Swatch className="bg-tertiary" />
          {deadEndColor[theme]} son celdas sin salida.
        </>
      ),
    },
    {
      anchor: "play",
      title: "Reprodúcelo",
      text: ({ wide }) =>
        `Mira cómo excava decisión por decisión, o avanza paso a paso con los botones de los costados.${wide ? " Con teclado: Espacio, ← y →." : ""}`,
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
      anchor: "stats",
      title: "Pasos y celdas sin salida",
      text: () => "Cuántas decisiones tomó y, al terminar, cuántas celdas sin salida tiene el laberinto: su textura en un número.",
    },
    {
      anchor: "settings",
      title: "Elige un tamaño",
      text: () => "Un laberinto pequeño para seguirlo de cerca, o uno grande para ver su textura.",
    },
    {
      anchor: "new",
      title: "Un laberinto nuevo",
      text: () => "Otro laberinto al azar del mismo tamaño. Comparte el enlace para mostrarle a alguien este mismo.",
    },
    {
      anchor: "race",
      title: "Lado a lado",
      text: () =>
        "Excava la misma semilla con hasta cuatro generadores a la vez. No hay ganador: compara sus celdas sin salida para ver cada textura.",
    },
  ],
});
