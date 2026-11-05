import { localized } from "@/i18n";
import type { InputOrder } from "@/types";

export const inputOrders = localized<Record<InputOrder, { label: string; description: string }>>({
  en: {
    random: { label: "Random", description: "Shuffled values: the typical case." },
    nearlySorted: { label: "Nearly sorted", description: "A few neighbours swapped: best case for insertion and bubble sort." },
    reversed: { label: "Reversed", description: "Largest first: the worst case for many algorithms." },
    sorted: { label: "Sorted", description: "Already in order: shows which algorithms notice." },
    fewUnique: { label: "Few unique", description: "Only five distinct values, repeated: shows how ties are handled." },
  },
  es: {
    random: { label: "Aleatorio", description: "Valores mezclados: el caso típico." },
    nearlySorted: { label: "Casi ordenado", description: "Algunos vecinos intercambiados: el mejor caso para Insertion y Bubble Sort." },
    reversed: { label: "Invertido", description: "El más grande primero: el peor caso para muchos algoritmos." },
    sorted: { label: "Ordenado", description: "Ya está en orden: muestra qué algoritmos se dan cuenta." },
    fewUnique: { label: "Pocos distintos", description: "Solo cinco valores distintos, repetidos: muestra cómo se manejan los empates." },
  },
});
