import { MAX_CAPACITY, MAX_ITEMS, MAX_WORD, type Item } from "./types";

/** Word pairs to start from: classic textbook examples, each showing something. */
export const wordPairs: { a: string; b: string; label: string }[] = [
  { a: "KITTEN", b: "SITTING", label: "Kitten · sitting" },
  { a: "SUNDAY", b: "SATURDAY", label: "Sunday · Saturday" },
  { a: "INTENTION", b: "EXECUTION", label: "Intention · execution" },
  { a: "ABCBDAB", b: "BDCABA", label: "ABCBDAB · BDCABA" },
  { a: "GATTACA", b: "TACTAG", label: "Gattaca · tactag" },
];

/** Uppercase letters, 1 to MAX_WORD of them; anything else is cleaned out. Empty means invalid. */
export const cleanWord = (text: string) =>
  text
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, MAX_WORD);

export const isWord = (text: string) => /^[A-Z]{1,10}$/.test(text);

/** A textbook bag: the best fill (B and C, worth 9) isn't the most valuable item first (D, worth 7). */
export const EXAMPLE_ITEMS: Item[] = [
  { weight: 1, value: 1 },
  { weight: 3, value: 4 },
  { weight: 4, value: 5 },
  { weight: 5, value: 7 },
];
export const EXAMPLE_CAPACITY = 7;

/**
 * For the race: eight light items and a bigger bag, so most items fit most of
 * the time and plain recursion has to branch at nearly every step. (With the
 * four-item example it barely repeats itself, and beats the full table.)
 */
export const RACE_ITEMS: Item[] = [
  { weight: 1, value: 1 },
  { weight: 2, value: 3 },
  { weight: 3, value: 4 },
  { weight: 2, value: 2 },
  { weight: 4, value: 6 },
  { weight: 3, value: 5 },
  { weight: 2, value: 3 },
  { weight: 3, value: 4 },
];
export const RACE_CAPACITY = 12;

/** A few random items, light to heavy, for a bag of `capacity`. */
export const randomItems = (count: number, random: () => number): Item[] =>
  Array.from({ length: count }, () => ({
    weight: 1 + Math.floor(random() * 6),
    value: 1 + Math.floor(random() * 9),
  }));

/** "1x1.3x4.4x5": weight x value, short and URL-safe. */
export const encodeItems = (items: Item[]) => items.map((it) => `${it.weight}x${it.value}`).join(".");

export const decodeItems = (text: string): Item[] | null => {
  const items: Item[] = [];
  for (const part of text.split(".")) {
    const match = /^(\d{1,2})x(\d{1,2})$/.exec(part);
    if (!match) return null;
    const weight = Number(match[1]);
    const value = Number(match[2]);
    if (weight < 1 || weight > MAX_CAPACITY || value < 1 || value > 99) return null;
    items.push({ weight, value });
  }
  return items.length && items.length <= MAX_ITEMS ? items : null;
};
