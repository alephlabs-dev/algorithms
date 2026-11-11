import { localized } from "@/i18n";
import type { Theme } from "@/store";

// The colors' names, as the tours say them. In Spanish they agree with feminine plurals ("barras", "celdas");
// tours about masculine things (nodos) name their colors inline.
export const colorNames = localized<Record<Theme, { comparing: string; done: string }>>({
  en: {
    dark: { comparing: "Purple", done: "green" },
    light: { comparing: "Orange", done: "teal" },
  },
  es: {
    dark: { comparing: "moradas", done: "verdes" },
    light: { comparing: "naranjas", done: "turquesa" },
  },
});
