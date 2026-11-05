import { localized } from "@/i18n";
import type { PathFrame } from "@/pathfinding";
import { count } from "./count";

const text = localized({
  en: {
    looked: (n: number) => `${count(n, "cell")} looked at.`,
    found: (n: number) => `Path found, ${count(n, "step")}.`,
    none: "No path.",
  },
  es: {
    looked: (n) => `${count(n, "celda")} ${n === 1 ? "revisada" : "revisadas"}.`,
    found: (n) => `Camino encontrado, ${count(n, "paso")}.`,
    none: "No hay camino.",
  },
});

/** What a frame shows, in words, for screen readers. */
export const describeFrame = (frame: PathFrame) =>
  frame.found === null ? text.looked(frame.stats.visited) : frame.found ? text.found(frame.stats.pathLength) : text.none;
