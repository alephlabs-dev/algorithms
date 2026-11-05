import type { DpAlgorithm, Method } from "@/dp";

type DpDetails = {
  title: string;
  /** Short name for tight spots (pickers on phones). */
  short: string;
  shortDescription: string;
  longDescription: string;
  /** Time and space for the inputs. */
  cost: string;
  /** What a cell holds. */
  cell: string;
};

// Key order is the order shown in the UI.
export const dpProblems: Record<DpAlgorithm, DpDetails> = {
  edit: {
    title: "Edit Distance",
    short: "Edit distance",
    shortDescription:
      "The fewest single-letter inserts, deletes and replacements that turn one word into another, worked out one table cell at a time.",
    longDescription:
      "Edit distance (or Levenshtein distance, after Vladimir Levenshtein, 1965) counts the fewest single-letter edits that turn one word into another: insert a letter, delete one, or replace one. Trying every sequence of edits would take forever, but the question breaks into smaller ones that overlap. Cell D[i][j] holds the distance between the first i letters of the first word and the first j of the second. The first row and column are easy: turning i letters into nothing takes i deletes. Every other cell comes from three neighbors already filled in: if the two letters match, it's the same as the diagonal; if not, it's one more than the cheapest of the diagonal (replace), the cell above (delete) or the cell to the left (insert). The bottom-right corner is the answer, and walking back from it, the way each value came, spells out the edits themselves. Spell checkers, DNA alignment and diff tools all use versions of it.",
    cost: "O(m·n) time and space",
    cell: "edits between two prefixes",
  },
  lcs: {
    title: "Longest Common Subsequence",
    short: "LCS",
    shortDescription:
      "The longest run of letters two words share in the same order, not necessarily side by side, built up from shorter prefixes.",
    longDescription:
      "A subsequence keeps some of a word's letters, in order, and drops the rest: ACE is a subsequence of ABCDE. The longest common subsequence of two words is the longest one they share. There are 2ⁿ subsequences of a word of n letters, too many to try, but the table makes it quick. Cell L[i][j] holds the length of the longest common subsequence of the first i letters of one word and the first j of the other. With nothing to compare (row or column 0) it's 0. Where the two letters match, they extend whatever the prefixes before them shared: the diagonal plus one. Where they don't, one of the two letters isn't in the answer, so the cell takes the better of dropping one (the cell above) or the other (the cell to the left). The corner holds the length; walking back, taking the diagonal at each match, picks out the letters. It's how diff finds the lines two files have in common, and a cousin of the DNA alignments biologists run.",
    cost: "O(m·n) time and space",
    cell: "letters shared by two prefixes",
  },
  knapsack: {
    title: "0/1 Knapsack",
    short: "Knapsack",
    shortDescription:
      "The most value that fits in a bag of limited weight, taking each item once or not at all, decided one smaller bag at a time.",
    longDescription:
      "You have a bag that holds a set weight and some items, each with a weight and a value. Which ones should go in? Grabbing the most valuable first, or the best value per kilo, can both go wrong; trying every subset means 2ⁿ of them. Dynamic programming asks a smaller question in each cell: K[i][w] is the most value you can get from the first i items in a bag of capacity w. With no items it's 0. For item i there are two choices. Leave it, and the best is whatever the first i − 1 items managed with the same room: the cell above. Or, if it fits, take it: its value plus the best the first i − 1 items managed in the room left over, w − its weight, which is the cell above and that many columns to the left. The cell keeps the better. The bottom-right corner is the answer, and walking back up, every place the value changes from the cell above is an item that was taken. The table has (n + 1) × (W + 1) cells, so it's quick when the capacity is a small number; the same idea schedules jobs, budgets and cargo.",
    cost: "O(n·W) time and space",
    cell: "best value from the first i items in room w",
  },
};

/** The race's three ways to solve the knapsack. */
export const dpMethods: Record<Method, { title: string; short: string }> = {
  table: { title: "Table (bottom-up)", short: "Table" },
  memo: { title: "Memoized recursion", short: "Memoized" },
  recursion: { title: "Plain recursion", short: "Recursion" },
};
