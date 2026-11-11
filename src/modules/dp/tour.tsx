import { localized } from "@/i18n";
import type { TourStep } from "@/modules/types";

// The guided tour: which control to light up, and what to say about it.

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
