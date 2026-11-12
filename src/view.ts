/** How a module shows its runs: one run, a race, or one run played in guess mode. */
export type View = "single" | "race" | "guess";
/** What the stage holds in a view: one run, or a race. The guess view's stage holds one run. */
export type StageView = "single" | "race";
export const stageViewOf = (view: View): StageView => (view === "race" ? "race" : "single");
