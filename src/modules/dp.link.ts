import { isWord } from "@/dp/presets";
import type { SpeedPreset } from "@/utils/speed";
import { speedParam, toQuery } from "./link";

/** A dynamic programming run as a link carries it: the two words, or the knapsack's items and capacity. */
export type DpLink = { a?: string; b?: string; items?: string; capacity?: number };

export const dpLink = {
  read: (params: URLSearchParams): DpLink => {
    const link: DpLink = {};
    const a = params.get("a")?.normalize("NFC").toUpperCase();
    const b = params.get("b")?.normalize("NFC").toUpperCase();
    if (a && isWord(a)) link.a = a;
    if (b && isWord(b)) link.b = b;
    const items = params.get("items");
    if (items && /^[0-9x.]+$/.test(items)) link.items = items;
    const capacity = Number(params.get("cap"));
    if (Number.isInteger(capacity) && capacity >= 1 && capacity <= 12) link.capacity = capacity;
    return link;
  },
  write: (link: DpLink, speed: SpeedPreset) =>
    toQuery({
      ...(link.a && { a: link.a }),
      ...(link.b && { b: link.b }),
      ...(link.items && { items: link.items }),
      ...(link.capacity !== undefined && { cap: String(link.capacity) }),
      ...speedParam(speed),
    }),
};
