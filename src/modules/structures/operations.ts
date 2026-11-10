import { MAX_VALUE, MIN_VALUE, type Operation } from "./types";

const LETTER = { insert: "i", search: "s", delete: "d" } as const;
const KIND = { i: "insert", s: "search", d: "delete" } as const;
/** Links stop growing past this many operations; older ones fall off the front. */
export const MAX_OPERATIONS = 80;

/** "i50.i30.s30.d50": short, readable, URL-safe. */
export const encodeOperations = (ops: Operation[]) => ops.map((op) => `${LETTER[op.kind]}${op.value}`).join(".");

export const decodeOperations = (text: string): Operation[] | null => {
  const ops: Operation[] = [];
  for (const part of text.split(".")) {
    const match = /^([isd])(\d{1,2})$/.exec(part);
    if (!match) return null;
    const value = Number(match[2]);
    if (value < MIN_VALUE || value > MAX_VALUE) return null;
    ops.push({ kind: KIND[match[1] as keyof typeof KIND], value });
  }
  return ops.length && ops.length <= MAX_OPERATIONS ? ops : null;
};
