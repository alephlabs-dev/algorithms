import { useShallow } from "zustand/react/shallow";
import { mazeAlgorithms } from "./algorithms";
import { lang, localized } from "@/i18n";
import type { MazeRun } from "./run";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { describeMazeFrame } from "./narrate";
import { MazeCanvas } from "./MazeStage";
import { ResultsOverlay } from "@/components/Race/RaceParts";

const text = localized({
  en: {
    steps: (n: number) => count(n, "step"),
    deadEnds: (n: number) => count(n, "dead end"),
    stepsSoFar: (n: number) => `${count(n, "step")} · `,
    generator: "Generator",
    stepsHeader: "Steps",
    deadEndsHeader: "Dead-end cells",
    texture:
      "No maze here is better than another. Few dead-end cells means long, winding corridors; many means lots of short branches.",
  },
  es: {
    steps: (n) => count(n, "paso"),
    deadEnds: (n) => `${n.toLocaleString("es")} sin salida`,
    stepsSoFar: (n) => `${count(n, "paso")} · `,
    generator: "Generador",
    stepsHeader: "Pasos",
    deadEndsHeader: "Celdas sin salida",
    texture:
      "Ningún laberinto es mejor que otro. Pocas celdas sin salida significan pasillos largos y sinuosos; muchas, montones de ramas cortas.",
  },
});

const format = (n: number) => n.toLocaleString(lang === "es" ? "es" : "en-US");
const lastFrame = (run: MazeRun) => run.frameAt(run.length - 1);

type LaneProps = { run: MazeRun; clock: number; gridId: number; className?: string };

/** One generator carving the shared seed: its steps so far, and its dead ends once it's done. */
const MazeRaceLane = ({ run, clock, gridId, className }: LaneProps) => {
  const frame = run.frameAt(Math.min(clock, run.length - 1));
  const { title, short } = mazeAlgorithms[run.algorithm];
  const { steps, deadEnds } = frame.stats;

  return (
    <section
      aria-label={title}
      className={cn("flex min-h-0 min-w-0 flex-col gap-1 rounded-3xl border border-edge bg-surface p-2 md:p-3", className)}
    >
      <header className="flex items-center gap-2 px-1 text-xs text-foreground md:text-sm">
        {/* Lanes are narrow on phones: the short name fits. */}
        <h3 className="truncate font-semibold">
          <span className="md:hidden">{short}</span>
          <span className="hidden md:inline">{title}</span>
        </h3>
        {/*
          While carving, the steps; once done, the dead ends too, the number that tells the textures apart.
          Phone lanes only have room for one, so there the dead ends replace the steps.
        */}
        <span className="ml-auto whitespace-nowrap font-mono text-foreground/70">
          {deadEnds === null ? (
            text.steps(steps)
          ) : (
            <>
              <span className="hidden md:inline">{text.stepsSoFar(steps)}</span>
              {text.deadEnds(deadEnds)}
            </>
          )}
        </span>
      </header>
      <MazeCanvas run={run} frame={frame} gridId={gridId} label={`${title}: ${describeMazeFrame(frame)}`} />
    </section>
  );
};

/** Each generator's steps and dead ends, in the racers' order: a comparison of textures, not a podium. */
const MazeRaceResults = ({ runs, onReplay }: { runs: MazeRun[]; onReplay: () => void }) => (
  <ResultsOverlay onReplay={onReplay}>
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-foreground/60">
          <th className="pb-2 font-normal">{text.generator}</th>
          <th className="pb-2 text-right font-normal">{text.stepsHeader}</th>
          <th className="pb-2 text-right font-normal">{text.deadEndsHeader}</th>
        </tr>
      </thead>
      <tbody>
        {runs.map((run) => {
          const { steps, deadEnds } = lastFrame(run).stats;
          return (
            <tr key={run.algorithm} className="border-t border-line/60">
              <td className="py-2 font-semibold">{mazeAlgorithms[run.algorithm].short}</td>
              <td className="py-2 text-right font-mono">{format(steps)}</td>
              <td className="py-2 text-right font-mono">{format(deadEnds ?? 0)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
    <p className="text-sm text-foreground/80">{text.texture}</p>
  </ResultsOverlay>
);

/** Every racer carving the same seed, two per row, one decision per tick each. */
export const MazeRaceLanes = () => {
  const { runs, clock, gridId, replay } = useStore(
    useShallow((s) => ({ runs: s.mazes.raceRuns, clock: s.frameIndex, gridId: s.mazes.inputId, replay: s.play })),
  );
  const lanes = runs.length;
  const done = clock > 0 && lanes > 0 && runs.every((r) => clock >= r.length - 1);

  return (
    <div data-tour="bars" className="relative flex min-h-0 flex-1">
      {/* Grids keep their shape, so two per row fits them best even on phones. */}
      <div className={cn("grid min-h-0 w-full grid-cols-2 gap-2 md:gap-3", lanes > 2 ? "grid-rows-2" : "grid-rows-1")}>
        {runs.map((run, k) => (
          <MazeRaceLane
            key={run.algorithm}
            run={run}
            clock={clock}
            gridId={gridId}
            // With three racers, the last lane takes the full bottom row.
            className={cn({ "col-span-2": lanes === 3 && k === 2 })}
          />
        ))}
      </div>
      {done && <MazeRaceResults runs={runs} onReplay={replay} />}
    </div>
  );
};
