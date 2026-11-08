/** Guess mode asks at most this many questions per run, in every module that uses `spread`. */
export const MAX_QUESTIONS = 10;

/** A moment a question could be asked about. */
export type Candidate = {
  /** The frame it would be asked before. */
  at: number;
  /** Its place among the run's moments of that kind (the 7th row tried, the 40th visit), for spacing. */
  k: number;
  /** Picked over the others in its stretch of the run, such as the first row after a backtrack. */
  preferred?: boolean;
};

/**
 * Picks at most `max` of the candidates, spread over the whole run: the run is cut into
 * `max` equal stretches of frames and each gives at most one, the first preferred one in
 * it or else its first. Two picks are always at least `gap` moments apart. `allow` can
 * turn a candidate down given the picks so far, so answers don't fall into a pattern.
 */
export const spread = <C extends Candidate>(
  candidates: C[],
  length: number,
  gap: number,
  { max = MAX_QUESTIONS, allow = () => true }: { max?: number; allow?: (c: C, picked: C[]) => boolean } = {},
): C[] => {
  const picked: C[] = [];
  for (let w = 0; w < max; w++) {
    const from = (length * w) / max;
    const to = (length * (w + 1)) / max;
    const last = picked[picked.length - 1];
    const fits = candidates.filter(
      (c) => c.at >= from && c.at < to && (!last || c.k - last.k >= gap) && allow(c, picked),
    );
    const pick = fits.find((c) => c.preferred) ?? fits[0];
    if (pick) picked.push(pick);
  }
  return picked;
};
