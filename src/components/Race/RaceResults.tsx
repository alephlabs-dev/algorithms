import { ResetIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import type { Timeline } from "@/algorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import type { Algorithm } from "@/types";
import { cn } from "@/utils/cn";
import { Button } from "../ui/button";

const ordinal = (n: number) => ["1st", "2nd", "3rd", "4th"][n - 1] ?? `${n}th`;
const format = (n: number) => n.toLocaleString("en-US");

type Props = {
  algorithms: Algorithm[];
  timelines: Timeline[];
  placeOf: (timeline: Timeline) => number;
  onReplay: () => void;
};

/** The podium: shown over the lanes when every racer has finished. Can be folded to look at the lanes. */
export const RaceResults = ({ algorithms, timelines, placeOf, onReplay }: Props) => {
  const [folded, setFolded] = useState(false);
  const rows = algorithms
    .map((algorithm, k) => ({ algorithm, timeline: timelines[k], place: placeOf(timelines[k]) }))
    .sort((a, b) => a.place - b.place);

  if (folded) {
    return (
      <Button
        className="absolute bottom-3 right-3 shadow-lg animate-in fade-in duration-200 motion-reduce:animate-none"
        onClick={() => setFolded(false)}
      >
        Show results
      </Button>
    );
  }

  return (
    <div className="absolute inset-0 grid place-items-center bg-background/60 p-4 backdrop-blur-[2px] animate-in fade-in duration-300 motion-reduce:animate-none">
      <section
        role="status"
        aria-label="Race results"
        className="flex w-full max-w-md flex-col gap-4 rounded-sm border border-line bg-background p-4 shadow-xl"
      >
        <h2 className="font-display text-xl font-semibold">Results</h2>
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
                    <span
                      className={cn("rounded-sm px-1.5 py-0.5 font-mono text-xs font-semibold", {
                        "bg-primary text-background": place === 1,
                        "bg-foreground/15": place !== 1,
                      })}
                    >
                      {ordinal(place)}
                    </span>
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
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setFolded(true)}>
            Hide
          </Button>
          <Button variant="primary" size="sm" onClick={onReplay}>
            <ResetIcon /> Race again
          </Button>
        </div>
      </section>
    </div>
  );
};
