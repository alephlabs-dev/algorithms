import { localized } from "@/i18n";
import { Swatch } from "@/components/TourSwatch";
import { colorNames } from "@/components/tourColors";
import type { TourStep } from "@/modules/types";

// The guided tour: which control to light up, and what to say about it.

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
          Circles are nodes, lines are edges; the one with the{" "}
          <Swatch className="ml-1 bg-background ring-2 ring-primary" />
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
          Los círculos son nodos y las líneas, aristas; el del{" "}
          <Swatch className="ml-1 bg-background ring-2 ring-primary" />
          anillo es el inicio. Arrastra un nodo para moverlo, toca dos nodos para unirlos o separarlos y toca dos veces
          uno para empezar ahí.
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
