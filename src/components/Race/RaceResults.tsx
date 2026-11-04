import type { Timeline } from "@/algorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import type { Algorithm } from "@/types";
import { PlaceBadge, ResultsOverlay } from "./RaceParts";

const format = (n: number) => n.toLocaleString("en-US");

type Props = {
  algorithms: Algorithm[];
  timelines: Timeline[];
  placeOf: (timeline: Timeline) => number;
  onReplay: () => void;
};

/** The podium: shown over the lanes when every racer has finished. */
export const RaceResults = ({ algorithms, timelines, placeOf, onReplay }: Props) => {
  const rows = algorithms
    .map((algorithm, k) => ({ algorithm, timeline: timelines[k], place: placeOf(timelines[k]) }))
    .sort((a, b) => a.place - b.place);

  return (
    <ResultsOverlay onReplay={onReplay}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-foreground/60">
            <th className="pb-2 font-normal">Place</th>
            <th className="pb-2 font-normal">Algorithm</th>
            <th className="pb-2 text-right font-normal">Operations</th>
            <th className="hidden pb-2 text-right font-normal sm:table-cell">Comparisons</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ algorithm, timeline, place }) => {
            const { stats } = timeline.frameAt(timeline.length - 1);
            return (
              <tr key={algorithm} className="border-t border-line/60">
                <td className="py-2">
                  <PlaceBadge place={place} />
                </td>
                <td className="py-2 font-semibold">{sortingAlgorithms[algorithm].title}</td>
                <td className="py-2 text-right font-mono">{format(timeline.totalOps)}</td>
                <td className="hidden py-2 text-right font-mono text-foreground/80 sm:table-cell">
                  {format(stats.comparisons)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ResultsOverlay>
  );
};
