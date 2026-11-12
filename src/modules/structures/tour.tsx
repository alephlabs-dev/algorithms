import { localized } from "@/i18n";
import type { TourStep } from "@/modules/types";

// The guided tour: which control to light up, and what to say about it.

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
        "Pick Guess and playback stops before the key moments to ask what comes next. Answer, then watch whether you were right. It keeps score.",
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
        "Elige Adivina y la reproducción se detiene antes de los momentos clave para preguntarte qué sigue. Responde y mira si acertaste. Lleva el puntaje.",
    },
    {
      anchor: "narration",
      title: "Sigue cada paso",
      text: ({ wide }) =>
        wide ? "El código que ejecuta y cada paso en palabras simples." : "Cada paso en palabras simples. Tócalo para ver el código.",
    },
  ],
});
