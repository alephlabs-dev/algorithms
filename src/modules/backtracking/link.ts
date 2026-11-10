import { SUDOKU_PUZZLES } from "./sudoku";
import { MAX_QUEENS, MIN_QUEENS, type FillOrder, type SudokuPuzzle } from "./types";
import { isOneOf, speedParam, toQuery, type LinkCodec } from "@/modules/link";

/** A backtracking run as a link carries it: the board size (N-Queens) or the puzzle and fill order (Sudoku). */
export type BacktrackingLink = { n?: number; puzzle?: SudokuPuzzle; order?: FillOrder };

const PUZZLES = Object.keys(SUDOKU_PUZZLES) as SudokuPuzzle[];

export const backtrackingLink: LinkCodec<BacktrackingLink> = {
  read: (params: URLSearchParams): BacktrackingLink => {
    const link: BacktrackingLink = {};
    const n = Number(params.get("n"));
    if (Number.isInteger(n) && n >= MIN_QUEENS && n <= MAX_QUEENS) link.n = n;
    const puzzle = params.get("puzzle");
    if (isOneOf(PUZZLES, puzzle)) link.puzzle = puzzle;
    if (params.get("order") === "mrv") link.order = "mrv";
    return link;
  },
  write: (link, speed) =>
    toQuery({
      ...(link.n !== undefined && { n: String(link.n) }),
      ...(link.puzzle && { puzzle: link.puzzle }),
      // Row by row is the default, so only fewest options first travels in the link.
      ...(link.order === "mrv" && { order: link.order }),
      ...speedParam(speed),
    }),
};
