import { localized } from "@/i18n";
import { MUD_COST } from "@/pathfinding";
import type { Theme } from "@/store";
import { Swatch } from "@/components/TourSwatch";
import { sortGuessSizes } from "./engine";
import type { TourStep } from "./types";

// The guided tour of each module: which control to light up, and what to say about it.

// The colors' names, as the tours say them. In Spanish they agree with feminine plurals ("barras", "celdas");
// tours about masculine things (nodos) name their colors inline.
const colorNames = localized<Record<Theme, { comparing: string; done: string }>>({
  en: {
    dark: { comparing: "Purple", done: "green" },
    light: { comparing: "Orange", done: "teal" },
  },
  es: {
    dark: { comparing: "moradas", done: "verdes" },
    light: { comparing: "naranjas", done: "turquesa" },
  },
});

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
  ],
});

export const graphsTour = localized<TourStep[]>({
  en: [
    {
      anchor: "picker",
      title: "Pick an algorithm",
      text: () => "Six algorithms: walk a graph, find the cheapest routes, build its lightest tree or put it in order.",
    },
    {
      anchor: "bars",
      title: "The graph",
      text: () => (
        <>
          Circles are nodes, lines are edges; the one with the <Swatch className="ml-1 bg-background ring-2 ring-primary" />
          ring is the start. Drag a node to move it, tap two nodes to join or split them, double-tap one to start there.
        </>
      ),
    },
    {
      anchor: "tools",
      phoneAnchor: "settings",
      title: "Layouts",
      text: ({ phone }) =>
        `${phone ? "In settings: a" : "A"} scattered network, a tree, a grid, or a DAG whose edges all point one way. Each tap makes a new one.`,
    },
    {
      anchor: "play",
      title: "Play it",
      text: ({ wide }) =>
        `Watch it spread, or go one step at a time with the buttons on either side.${wide ? " On a keyboard: Space, ← and →." : ""}`,
    },
    {
      anchor: "structure",
      title: "What sets them apart",
      text: () =>
        "What's waiting its turn. Breadth-first takes from the front of a queue, depth-first from the top of a stack, Dijkstra and Prim whichever is closest; Kruskal lines up edges instead.",
    },
    {
      anchor: "narration",
      title: "Follow each step",
      text: ({ theme, wide }) => (
        <>
          <Swatch className="bg-secondary" />
          {colorNames[theme].comparing} nodes are waiting, faded ones are visited, and the{" "}
          <Swatch className="bg-primary" />
          {colorNames[theme].done} edges are the tree it builds.{" "}
          {wide ? "Here: the code it's running and what just happened." : "Tap here to see the code it's running."}
        </>
      ),
    },
    {
      anchor: "settings",
      title: "Change the graph",
      text: () => "Fewer nodes to read along, or more to see the pattern.",
    },
  ],
  es: [
    {
      anchor: "picker",
      title: "Elige un algoritmo",
      text: () => "Seis algoritmos: recorrer un grafo, encontrar las rutas más baratas, construir su árbol más liviano u ordenarlo.",
    },
    {
      anchor: "bars",
      title: "El grafo",
      text: () => (
        <>
          Los círculos son nodos y las líneas, aristas; el del <Swatch className="ml-1 bg-background ring-2 ring-primary" />
          anillo es el inicio. Arrastra un nodo para moverlo, toca dos nodos para unirlos o separarlos y toca dos veces uno para empezar ahí.
        </>
      ),
    },
    {
      anchor: "tools",
      phoneAnchor: "settings",
      title: "Disposiciones",
      text: ({ phone }) =>
        `${phone ? "En los ajustes: una" : "Una"} red dispersa, un árbol, una malla o un DAG con todas las aristas hacia el mismo lado. Cada toque crea uno nuevo.`,
    },
    {
      anchor: "play",
      title: "Reprodúcelo",
      text: ({ wide }) =>
        `Mira cómo se expande, o avanza paso a paso con los botones de los costados.${wide ? " Con teclado: Espacio, ← y →." : ""}`,
    },
    {
      anchor: "structure",
      title: "Lo que los distingue",
      text: () =>
        "Lo que espera su turno. La búsqueda en anchura toma del frente de una cola, la búsqueda en profundidad del tope de una pila, Dijkstra y Prim el más cercano; Kruskal, en cambio, pone en fila las aristas.",
    },
    {
      anchor: "narration",
      title: "Sigue cada paso",
      text: ({ theme, wide }) => (
        <>
          Los <Swatch className="bg-secondary" />
          nodos {theme === "dark" ? "morados" : "naranjas"} esperan, los atenuados ya se visitaron y las{" "}
          <Swatch className="bg-primary" />
          aristas {theme === "dark" ? "verdes" : "turquesa"} son el árbol que construye.{" "}
          {wide ? "Aquí: el código que ejecuta y lo que acaba de pasar." : "Toca aquí para ver el código que ejecuta."}
        </>
      ),
    },
    {
      anchor: "settings",
      title: "Cambia el grafo",
      text: () => "Menos nodos para seguirlo de cerca, o más para ver el patrón.",
    },
  ],
});

export const fourierTour: TourStep[] = [
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
];

export const structuresTour = localized<TourStep[]>({
  en: [
    {
      anchor: "picker",
      title: "Pick a structure",
      text: () => "Two search trees (one rebalances itself as it goes), a min-heap, and a hash table two ways.",
    },
    {
      anchor: "bars",
      title: "The structure",
      text: () => "Press play to watch it built one insert at a time. The strip on top shows what's coming: guess where each value lands, then see.",
    },
    {
      anchor: "structure",
      title: "Operate on it",
      text: () => "Type a value, then insert, find or delete it. Each operation plays step by step: every comparison, rotation, swap or probe.",
    },
    {
      anchor: "tools",
      phoneAnchor: "settings",
      title: "Starting values",
      text: ({ phone }) =>
        `${phone ? "In settings: try" : "Try"} ascending values: a plain BST turns into a long list, while an AVL tree keeps rotating to stay short.`,
    },
    {
      anchor: "play",
      title: "Play it",
      text: ({ wide }) =>
        `Watch it, or go one step at a time with the buttons on either side.${wide ? " On a keyboard: Space, ← and →." : ""}`,
    },
    {
      anchor: "game",
      title: "A guessing game",
      text: () =>
        "Turn on Guess and playback stops before the key moments to ask what comes next. Answer, then watch whether you were right. It keeps score.",
    },
    {
      anchor: "narration",
      title: "Follow each step",
      text: ({ wide }) =>
        wide ? "The code it's running, and each step in plain words." : "Each step in plain words. Tap it to see the code.",
    },
  ],
  es: [
    {
      anchor: "picker",
      title: "Elige una estructura",
      text: () => "Dos árboles de búsqueda (uno se rebalancea solo), un montículo mínimo y una tabla hash de dos formas.",
    },
    {
      anchor: "bars",
      title: "La estructura",
      text: () =>
        "Presiona play para verla construirse inserción por inserción. La fila de arriba muestra lo que viene: adivina dónde cae cada valor y compruébalo.",
    },
    {
      anchor: "structure",
      title: "Opera sobre ella",
      text: () =>
        "Escribe un valor y después insértalo, búscalo o bórralo. Cada operación se reproduce paso a paso: cada comparación, rotación, intercambio o sondeo.",
    },
    {
      anchor: "tools",
      phoneAnchor: "settings",
      title: "Valores iniciales",
      text: ({ phone }) =>
        `${phone ? "En los ajustes, prueba" : "Prueba"} valores ascendentes: un BST simple se vuelve una lista larga, mientras que un árbol AVL rota una y otra vez para mantenerse bajo.`,
    },
    {
      anchor: "play",
      title: "Reprodúcelo",
      text: ({ wide }) =>
        `Míralo, o avanza paso a paso con los botones de los costados.${wide ? " Con teclado: Espacio, ← y →." : ""}`,
    },
    {
      anchor: "game",
      title: "Un juego de adivinar",
      text: () =>
        "Activa Adivina y la reproducción se detiene antes de los momentos clave para preguntarte qué sigue. Responde y mira si acertaste. Lleva el puntaje.",
    },
    {
      anchor: "narration",
      title: "Sigue cada paso",
      text: ({ wide }) =>
        wide ? "El código que ejecuta y cada paso en palabras simples." : "Cada paso en palabras simples. Tócalo para ver el código.",
    },
  ],
});

export const dpTour = localized<TourStep[]>({
  en: [
    {
      anchor: "picker",
      title: "Pick a problem",
      text: () =>
        "Edit distance (how many edits turn one word into another), the longest common subsequence (what they share), or the knapsack (what fits in a bag).",
    },
    {
      anchor: "bars",
      title: "The table",
      text: () =>
        "One word down the side, one across the top. Each cell answers the question for the first letters of each, built from cells already filled. Guess the next one before it appears.",
    },
    {
      anchor: "words",
      phoneAnchor: "settings",
      title: "Your input",
      text: () => "Type any two words, up to 10 letters each. For the knapsack: the size of the bag, and how many items.",
    },
    {
      anchor: "tools",
      phoneAnchor: "settings",
      title: "Examples",
      text: ({ phone }) => `${phone ? "In settings: classic" : "Classic"} pairs to start from, like kitten and sitting.`,
    },
    {
      anchor: "play",
      title: "Play it",
      text: () => "The table fills cell by cell, then the way back from the corner spells out the answer under it.",
    },
    {
      anchor: "game",
      title: "A guessing game",
      text: () =>
        "Turn on Guess and playback stops before the key moments to ask what comes next. Answer, then watch whether you were right. It keeps score.",
    },
    {
      anchor: "narration",
      title: "Follow each step",
      text: ({ wide }) =>
        wide ? "The code it's running, and each step in plain words." : "Each step in plain words. Tap it to see the code.",
    },
  ],
  es: [
    {
      anchor: "picker",
      title: "Elige un problema",
      text: () =>
        "La distancia de edición (cuántas ediciones convierten una palabra en otra), la subsecuencia común más larga (qué comparten) o la mochila (qué cabe en una mochila).",
    },
    {
      anchor: "bars",
      title: "La tabla",
      text: () =>
        "Una palabra en el costado y otra arriba. Cada celda responde la pregunta para las primeras letras de cada una, a partir de celdas ya calculadas. Adivina la siguiente antes de que aparezca.",
    },
    {
      anchor: "words",
      phoneAnchor: "settings",
      title: "Tus datos",
      text: () =>
        "Escribe dos palabras cualesquiera, de hasta 10 letras cada una. Para la mochila: su capacidad y cuántos objetos hay.",
    },
    {
      anchor: "tools",
      phoneAnchor: "settings",
      title: "Ejemplos",
      text: ({ phone }) =>
        `${phone ? "En los ajustes: pares" : "Pares"} clásicos para empezar, como kitten y sitting.`,
    },
    {
      anchor: "play",
      title: "Reprodúcelo",
      text: () => "La tabla se llena celda por celda, y después el camino de vuelta desde la esquina muestra la respuesta debajo.",
    },
    {
      anchor: "game",
      title: "Un juego de adivinar",
      text: () =>
        "Activa Adivina y la reproducción se detiene antes de los momentos clave para preguntarte qué sigue. Responde y mira si acertaste. Lleva el puntaje.",
    },
    {
      anchor: "narration",
      title: "Sigue cada paso",
      text: ({ wide }) =>
        wide ? "El código que ejecuta y cada paso en palabras simples." : "Cada paso en palabras simples. Tócalo para ver el código.",
    },
  ],
});
