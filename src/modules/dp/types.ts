/**
 * Dynamic programming: a table where each cell answers a smaller version of
 * the question (a prefix of each word, the first few items and a smaller bag),
 * filled from cells already known, then walked back from the corner to read
 * off the answer.
 */

export type DpAlgorithm = "edit" | "lcs" | "knapsack";

/** Three ways to the same knapsack answer, for the race. */
export type Method = "table" | "memo" | "recursion";
/** The problems on two words. */
export type WordsAlgorithm = "edit" | "lcs";

/** Uppercase letters only, short enough for the table to stay readable on a phone. */
export const MAX_WORD = 10;

export type Cell = { i: number; j: number };
export type Direction = "diag" | "up" | "left";
/** How a cell's value can come about: from a neighbor (words), or by leaving or taking an item (knapsack). */
export type Way = Direction | "leave" | "take";

/** One way a cell's value could come about: from `cell`, worth `value` that way. */
export type Option = { from: Way; value: number; cell: Cell };

/**
 * A step back along the answer. Edit distance: keep a matching letter,
 * replace, delete from the first word, or insert from the second. LCS: keep a
 * shared letter, or skip one of the two.
 */
export type TraceStep = {
  i: number;
  j: number;
  move: Way;
  kind: "match" | "replace" | "delete" | "insert" | "keep" | "skip" | "take" | "leave";
  /** The cell the way back goes to next. */
  to: Cell;
};

export type DpEvent =
  | { type: "start" }
  /** The first row and column, which need no neighbors. */
  | { type: "base" }
  /** Cell (i, j) worked out from `options`; `pick` is the way it went. */
  | { type: "cell"; i: number; j: number; value: number; match: boolean; options: Option[]; pick: Way }
  | { type: "trace"; step: TraceStep }
  | { type: "done"; answer: number };

export type DpFrame = {
  event: DpEvent;
  /** Whether the first row and column are in. */
  base: boolean;
  /** How many inner cells are in, row by row. */
  filled: number;
  focus: Cell | null;
  /** The cells the focus is worked out from. */
  deps: Cell[];
  /** The way back so far, from the corner. */
  trace: TraceStep[];
  line: number | null;
};

/** What the table view needs from any of the problems. */
export type TableRun = {
  readonly algorithm: DpAlgorithm;
  readonly table: number[][];
  readonly frames: DpFrame[];
  readonly answer: number;
  readonly trace: TraceStep[];
  readonly length: number;
  /** Down the side and across the top, row 0 and column 0 included. */
  readonly rowLabels: string[];
  readonly colLabels: string[];
  /** Where (i, j) comes in the fill order, or −1 for the cells filled first, all at once. */
  fillIndex: (i: number, j: number) => number;
};

/** A knapsack item. */
export type Item = { weight: number; value: number };
export const MAX_ITEMS = 8;
export const MAX_CAPACITY = 12;
