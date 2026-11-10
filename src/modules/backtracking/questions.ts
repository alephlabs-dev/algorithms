import { attacker, type QueensRun } from "./queens";
import { localized } from "@/i18n";
import { choicesAround, verdict } from "@/game/choices";
import type { Question } from "@/game/questions";
import { spread, type Candidate } from "@/game/spread";

/** The option that says no column fits: the row is a dead end. Columns are their number, from 1. */
export const DEAD_END = 0;

/** At least this many rows tried between two questions: about one in three. */
const GAP = 3;

/** "1, 2 and 4" */
const list = (items: number[], and: string) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;

const text = localized({
  en: {
    lands: (row: number) => `Which column will row ${row}'s queen land in?`,
    resumes: (row: number, left: number) => `Row ${row}'s queen left column ${left}. Where does it land next?`,
    deadEnd: "Dead end",
    its: (col: number | null) => (col === null ? "It's a dead end" : `It's column ${col}`),
    safe: (col: number) => `column ${col} is safe`,
    attacked: (cols: number[], rows: number[]) =>
      `${cols.length === 1 ? `column ${cols[0]} is` : `columns ${list(cols, "and")} are`} attacked (by ${
        rows.length === 1 ? `the queen in row ${rows[0]}` : `the queens in rows ${list(rows, "and")}`
      })`,
    soLands: (col: number) => `, so it lands in column ${col}`,
    soBack: (row: number) => `, so row ${row}'s queen is taken back`,
  },
  es: {
    lands: (row) => `¿En qué columna cae la reina de la fila ${row}?`,
    resumes: (row, left) => `La reina de la fila ${row} dejó la columna ${left}. ¿Dónde cae ahora?`,
    deadEnd: "Sin salida",
    its: (col) => (col === null ? "Es un callejón sin salida" : `Es la columna ${col}`),
    safe: (col) => `la columna ${col} está libre`,
    attacked: (cols, rows) =>
      `${cols.length === 1 ? `la columna ${cols[0]} está atacada` : `las columnas ${list(cols, "y")} están atacadas`} (por ${
        rows.length === 1 ? `la reina de la fila ${rows[0]}` : `las reinas de las filas ${list(rows, "y")}`
      })`,
    soLands: (col) => `, así que cae en la columna ${col}`,
    soBack: (row) => `, así que se quita la reina de la fila ${row}`,
  },
});

/** One time the search tries the columns of a row, from where it arrives (or comes back) to a choice or a dead end. */
type Attempt = Candidate & {
  row: number;
  /** The first column it tries, from 0: 0 on arriving, one past the taken-back queen after a backtrack. */
  from: number;
  /** The column it lands in, from 0, or null for a dead end. */
  lands: number | null;
  /** The queens above, as they stand while it tries. */
  queens: number[];
};

/** Every attempt in the run except the very first (row 1 always lands in column 1). */
export const queensAttempts = (run: QueensRun): Attempt[] => {
  const attempts: Attempt[] = [];
  const { frames, n } = run;
  let k = 0;
  frames.forEach((frame, i) => {
    const { event } = frame;
    let row: number;
    let from: number;
    if (event.type === "choice") [row, from] = [event.row + 1, 0];
    else if (event.type === "backtrack") [row, from] = [event.row, event.col + 1];
    else return;
    // Past the last row it's solved; past the last column only "dead end" is left, nothing to guess.
    if (row === n || from === n) return;
    const end = frames.findIndex(
      (f, j) => j > i && (f.event.type === "choice" || f.event.type === "deadEnd") && f.event.row === row,
    );
    if (end < 0) return;
    const ends = frames[end].event;
    k++;
    attempts.push({
      at: i + 1,
      k,
      preferred: event.type === "backtrack",
      row,
      from,
      lands: ends.type === "choice" ? ends.col : null,
      queens: frame.queens,
    });
  });
  return attempts;
};

/**
 * A dead end only when the last answer wasn't one, and while dead ends stay within a
 * third of the questions (rounded up). Rows after a backtrack are mostly dead ends, so
 * without this a learner could score by always answering "Dead end".
 */
const fewDeadEnds = (c: Attempt, picked: Attempt[]) => {
  if (c.lands !== null) return true;
  const deadEnds = picked.filter((p) => p.lands === null).length;
  return picked[picked.length - 1]?.lands !== null && deadEnds + 1 <= Math.ceil((picked.length + 1) / 3);
};

/**
 * N-Queens: which column the next queen lands in, or whether the row is a dead end.
 * At most ten per run, spread over it, and the first row after a backtrack goes first.
 */
export const queensQuestions = (run: QueensRun): Question[] =>
  spread(queensAttempts(run), run.length, GAP, { allow: fewDeadEnds }).map(({ at, row, from, lands, queens }) => {
    const answer = lands === null ? DEAD_END : lands + 1;
    // Up to four columns from where it starts trying, around the answer (the last ones for a dead end), then "dead end".
    const columns = choicesAround(lands ?? run.n - 1, [], from, run.n - 1).map((c) => c + 1);
    const options = [...columns, DEAD_END];
    const skipped = Array.from({ length: (lands ?? run.n) - from }, (_, k) => from + k);
    // The queens that rule those columns out, each named once, top row first.
    const by = [...new Set(skipped.map((col) => attacker(queens, row, col)!.row + 1))].sort((a, b) => a - b);
    const why =
      skipped.length === 0
        ? text.safe(lands! + 1)
        : text.attacked(
            skipped.map((c) => c + 1),
            by,
          ) + (lands === null ? text.soBack(row) : text.soLands(lands + 1));
    return {
      kind: "choice",
      at,
      run,
      prompt: from === 0 ? text.lands(row + 1) : text.resumes(row + 1, from),
      options,
      optionLabels: options.map((o) => (o === DEAD_END ? text.deadEnd : String(o))),
      answer,
      queenRow: { row, from },
      explain: (right) => `${right ? verdict.right : text.its(lands === null ? null : lands + 1)}: ${why}.`,
    };
  });
