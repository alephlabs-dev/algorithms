import { lang } from "@/i18n";

/**
 * "1 comparison", "2 comparisons", "1,024 swaps". Pass the plural when adding
 * an "s" isn't enough ("comparación", "comparaciones").
 */
export const count = (n: number, noun: string, plural = `${noun}s`) =>
  `${n.toLocaleString(lang === "es" ? "es" : "en-US")} ${n === 1 ? noun : plural}`;
