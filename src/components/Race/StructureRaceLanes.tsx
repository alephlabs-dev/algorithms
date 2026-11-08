import { useShallow } from "zustand/react/shallow";
import { structures } from "@/consts/structures";
import type { TreeRecorder } from "@/structures";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { ordinal } from "@/utils/ordinal";
import { StructureCanvas } from "../Structures/StructureStage";
import { PlaceBadge, ResultsOverlay } from "./RaceParts";
import { localized } from "@/i18n";

const text = localized({
  en: {
    finished: (place: string) => `, finished ${place}`,
    height: (h: number) => `height ${h}`,
    label: (title: string, h: number) => `${title}: height ${h}.`,
    place: "Place",
    tree: "Tree",
    heightHeader: "Height",
    comparisons: "Comparisons",
    rotations: "Rotations",
    balanced: (avl: number, bst: number) =>
      `Balancing kept the AVL tree ${avl} tall; the plain BST grew to ${bst}, so every search there walks further.`,
    same: "Same height: in this order the plain BST stayed bushy on its own. Try ascending values.",
  },
  es: {
    finished: (place) => `, terminó ${place}`,
    height: (h) => `altura ${h}`,
    label: (title, h) => `${title}: altura ${h}.`,
    place: "Lugar",
    tree: "Árbol",
    heightHeader: "Altura",
    comparisons: "Comparaciones",
    rotations: "Rotaciones",
    balanced: (avl, bst) =>
      `El balanceo dejó el árbol AVL con altura ${avl}; el BST simple llegó a ${bst}, así que cada búsqueda ahí recorre más.`,
    same: "Misma altura: en este orden el BST simple quedó frondoso por sí solo. Prueba valores ascendentes.",
  },
});


const format = (n: number) => n.toLocaleString("en-US");
const last = (run: TreeRecorder) => run.frames[run.frames.length - 1];

const StructureRaceLane = ({ run, clock, place }: { run: TreeRecorder; clock: number; place: number }) => {
  const end = run.frames.length - 1;
  const frame = run.frames[Math.min(clock, end)];
  const finished = clock > 0 && clock >= end;
  const { title } = structures[run.algorithm];
  return (
    <section
      aria-label={`${title}${finished ? text.finished(ordinal(place)) : ""}`}
      className={cn(
        "flex min-h-0 min-w-0 flex-col gap-1 rounded-3xl border border-edge bg-surface p-2 ring-1 ring-transparent transition-shadow md:p-3",
        { "ring-primary": finished && place === 1 },
      )}
    >
      <header className="flex items-center gap-2 px-1 text-xs text-foreground md:text-sm">
        <h3 className="truncate font-semibold">{title}</h3>
        {finished && <PlaceBadge place={place} />}
        <span className="ml-auto whitespace-nowrap font-mono text-foreground/70">
          {text.height(Math.max(0, frame.height))}
        </span>
      </header>
      <StructureCanvas frame={frame} algorithm={run.algorithm} label={text.label(title, Math.max(0, frame.height))} />
    </section>
  );
};

/** The same operations on a plain BST and an AVL tree, one step per tick each. */
export const StructureRaceLanes = () => {
  const { runs, clock, replay } = useStore(
    useShallow((s) => ({ runs: s.structures.raceRuns, clock: s.frameIndex, replay: s.play })),
  );
  // Fewer comparisons wins: the work a search tree exists to save. (Steps would reward skipping the rotations.)
  const placeOf = (run: TreeRecorder) =>
    1 + runs.filter((o) => last(o).stats.comparisons < last(run).stats.comparisons).length;
  const finished = clock > 0 && runs.length > 0 && runs.every((r) => clock >= r.frames.length - 1);
  const rows = runs.map((run) => ({ run, place: placeOf(run) })).sort((a, b) => a.place - b.place);
  const bst = runs.find((r) => r.algorithm === "bst");
  const avl = runs.find((r) => r.algorithm === "avl");

  return (
    <div data-tour="bars" className="relative flex min-h-0 flex-1">
      {/* Side by side on wide screens; stacked on phones, where trees need the width. */}
      <div className="grid min-h-0 w-full grid-rows-2 gap-2 md:grid-cols-2 md:grid-rows-1 md:gap-3">
        {runs.map((run) => (
          <StructureRaceLane key={run.algorithm} run={run} clock={clock} place={placeOf(run)} />
        ))}
      </div>
      {finished && (
        <ResultsOverlay onReplay={replay}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-foreground/60">
                <th className="pb-2 font-normal">{text.place}</th>
                <th className="pb-2 font-normal">{text.tree}</th>
                <th className="pb-2 text-right font-normal">{text.heightHeader}</th>
                <th className="pb-2 text-right font-normal">{text.comparisons}</th>
                <th className="hidden pb-2 text-right font-normal sm:table-cell">{text.rotations}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ run, place }) => (
                <tr key={run.algorithm} className="border-t border-line/60">
                  <td className="py-2">
                    <PlaceBadge place={place} />
                  </td>
                  <td className="py-2 font-semibold">{structures[run.algorithm].short}</td>
                  <td className="py-2 text-right font-mono">{Math.max(0, last(run).height)}</td>
                  <td className="py-2 text-right font-mono">{format(last(run).stats.comparisons)}</td>
                  <td className="hidden py-2 text-right font-mono sm:table-cell">
                    {format(last(run).stats.rotations)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bst && avl && (
            <p className="text-sm text-foreground/80">
              {last(bst).height > last(avl).height
                ? text.balanced(Math.max(0, last(avl).height), last(bst).height)
                : text.same}
            </p>
          )}
        </ResultsOverlay>
      )}
    </div>
  );
};
