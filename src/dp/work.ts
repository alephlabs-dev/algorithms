import type { Item } from "./types";

/** Three ways to the same knapsack answer, for the race. */
export type Method = "table" | "memo" | "recursion";
export const methods: Method[] = ["table", "memo", "recursion"];

/** One subproblem solved (or looked up): K for the first `i` items and room `w`. */
export type Call = {
  i: number;
  w: number;
  /** This subproblem was solved before. */
  repeat: boolean;
  /** Memoized: answered from the memo, no work below it. */
  cached: boolean;
};

/**
 * Records every subproblem each method touches, in order. The table fills
 * every cell once, row by row. Recursion asks K(n, W), which asks K(n−1, …)
 * once or twice, and so on down, solving the same subproblems again and
 * again. Memoized recursion asks the same way but writes answers down, so a
 * repeat is just a lookup, and it only ever touches cells the answer needs.
 */
export class KnapsackWork {
  readonly calls: Call[] = [];
  readonly answer: number;

  constructor(
    readonly method: Method,
    readonly items: Item[],
    readonly capacity: number,
  ) {
    const seen = new Set<string>();
    const visit = (i: number, w: number, cached = false) => {
      const key = `${i},${w}`;
      this.calls.push({ i, w, repeat: seen.has(key), cached });
      seen.add(key);
    };
    if (method === "table") {
      const T = items.map(() => [] as number[]);
      const row = (i: number, w: number) => (i === 0 ? 0 : T[i - 1][w]);
      for (let w = 0; w <= capacity; w++) visit(0, w);
      items.forEach((item, k) => {
        for (let w = 0; w <= capacity; w++) {
          visit(k + 1, w);
          T[k][w] = Math.max(row(k, w), item.weight <= w ? row(k, w - item.weight) + item.value : 0);
        }
      });
      this.answer = row(items.length, capacity);
      return;
    }
    const memo = new Map<string, number>();
    const solve = (i: number, w: number): number => {
      const key = `${i},${w}`;
      if (method === "memo" && memo.has(key)) {
        visit(i, w, true);
        return memo.get(key)!;
      }
      visit(i, w);
      if (i === 0) {
        if (method === "memo") memo.set(key, 0);
        return 0;
      }
      const { weight, value } = items[i - 1];
      let best = solve(i - 1, w);
      if (weight <= w) best = Math.max(best, solve(i - 1, w - weight) + value);
      if (method === "memo") memo.set(key, best);
      return best;
    };
    this.answer = solve(items.length, capacity);
  }

  get length() {
    return this.calls.length;
  }
}
