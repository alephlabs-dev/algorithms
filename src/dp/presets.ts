import { MAX_WORD } from "./types";

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
