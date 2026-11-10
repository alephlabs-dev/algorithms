import { MAX_VALUE, MIN_VALUE, type Operation } from "./types";

export type StructurePreset = "random" | "ascending" | "example";
export const structurePresets: StructurePreset[] = ["random", "ascending", "example"];

export type StructureSize = "small" | "medium" | "large";
export const structureSizes: StructureSize[] = ["small", "medium", "large"];
const COUNT: Record<StructureSize, number> = { small: 7, medium: 12, large: 20 };

/** The inserts a preset starts with. */
export const presetOperations = (preset: StructurePreset, size: StructureSize, random: () => number): Operation[] => {
  const count = COUNT[size];
  let values: number[];
  if (preset === "ascending") {
    // Already sorted: a plain BST becomes a list, an AVL tree keeps rotating to stay short.
    const step = Math.floor((MAX_VALUE - MIN_VALUE) / count);
    values = Array.from({ length: count }, (_, k) => MIN_VALUE + step * (k + 1));
  } else if (preset === "example") {
    // A hand-picked order that shows each kind of AVL rotation, then fills in.
    values = [50, 30, 20, 70, 80, 75, 40, 35, 45, 10, 60, 90, 85, 25, 65, 95, 15, 55, 5, 98].slice(0, count);
  } else {
    const pool = Array.from({ length: MAX_VALUE - MIN_VALUE + 1 }, (_, k) => MIN_VALUE + k);
    values = [];
    while (values.length < count) values.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return values.map((value) => ({ kind: "insert", value }));
};
