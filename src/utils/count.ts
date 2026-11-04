/** "1 comparison", "2 comparisons", "1,024 swaps". */
export const count = (n: number, noun: string) => `${n.toLocaleString("en-US")} ${noun}${n === 1 ? "" : "s"}`;
