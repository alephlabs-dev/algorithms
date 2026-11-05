import type { DpAlgorithm } from "@/dp";

type DpDetails = {
  title: string;
  /** Short name for tight spots (pickers on phones). */
  short: string;
  shortDescription: string;
  longDescription: string;
  /** Time and space for words of length m and n. */
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
};
