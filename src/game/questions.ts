/** An empty spot in a tree where a new value could go: under `parent`, on `side`. */
export type Slot = {
  key: string;
  parent: number;
  side: "left" | "right";
  /** "left of 30": for the buttons that stand in for tapping. */
  label: string;
};

type Base = {
  /** Asked just before playback shows this frame, which would give the answer away. */
  at: number;
  /** The run it's about; a question for a run that's been replaced is stale. */
  run: object;
  prompt: string;
  /** What to say once it's answered, right or wrong. */
  explain: (right: boolean) => string;
  /** Items the stage labels with their values while it asks, so the prompt's numbers can be found. */
  labels?: number[];
};

export type Question =
  /** Tap the spot in the tree where the value will land. */
  | (Base & { kind: "slot"; value: number; slots: Slot[]; answer: string })
  /** Pick one of a few numbers (a cell's value, a bucket, a count of swaps). */
  | (Base & {
      kind: "choice";
      options: number[];
      answer: number;
      cell?: { i: number; j: number };
      /** N-Queens: the row the queen is about to land in, and the first column it tries (both from 0). */
      queenRow?: { row: number; from: number };
      /** Pathfinding: the options are grid cells, marked on the grid with their labels (A–D). */
      gridCells?: boolean;
      /** Where each marked cell is, for screen readers: "A: row 2, column 5; …". */
      marksText?: string;
      /** What each option's button says, when the bare number can't (heap sort's "4 stays"). */
      optionLabels?: string[];
    })
  | (Base & { kind: "yesno"; answer: boolean });

export type Answer = string | number | boolean;

/** A question whose options are grid cells marked with letters (pathfinding). */
export type CellQuestion = Extract<Question, { kind: "choice" }> & { gridCells: true };

export const isCellQuestion = (q: Question | null | undefined): q is CellQuestion =>
  q?.kind === "choice" && q.gridCells === true;

