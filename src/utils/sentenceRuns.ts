// What every module's step sentence runs (src/modules/<id>/sentences.ts) share.

export const SEEDS = [1, 2, 3];

/** Phones and upright screens lay grids and graphs out tall and narrow; landscape screens wide. */
export const LAYOUTS = [
  { narrow: true, name: "narrow" },
  { narrow: false, name: "wide" },
];
