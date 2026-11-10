import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { DpWorkRenderer } from "./dpWorkRenderer";
import { dpMethods } from "./algorithms";
import type { KnapsackWork } from "./work";
import { useElementSize } from "@/hooks/useElementSize";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { ordinal } from "@/utils/ordinal";
import { PlaceBadge, ResultsOverlay } from "@/components/Race/RaceParts";
import { localized } from "@/i18n";

const text = localized({
  en: {
    finished: (place: string) => `, finished ${place}`,
    calls: (n: string, one: boolean) => `${n} ${one ? "call" : "calls"}`,
    soFar: (title: string, n: string) => `${title}: ${n} subproblems so far.`,
    place: "Place",
    method: "Method",
    callsHeader: "Calls",
    repeats: "Repeats",
    fewItems: (answer: number) =>
      `Same answer, ${answer}, every way. With this few items plain recursion hardly repeats itself, so filling the whole table is more work. Add items (or a bigger bag) and watch it blow up: its calls roughly double with every item.`,
    manyItems: (answer: number, repeats: string, table: string) =>
      `Same answer, ${answer}, every way. Plain recursion worked out ${repeats} subproblems it had already solved; the table did each of its ${table} once, and memoizing only touched the ones the answer needs.`,
  },
  es: {
    finished: (place) => `, terminó ${place}`,
    calls: (n, one) => `${n} ${one ? "llamada" : "llamadas"}`,
    soFar: (title, n) => `${title}: ${n} subproblemas hasta ahora.`,
    place: "Lugar",
    method: "Método",
    callsHeader: "Llamadas",
    repeats: "Repetidas",
    fewItems: (answer) =>
      `La misma respuesta, ${answer}, de las tres formas. Con tan pocos objetos la recursión simple casi no se repite, así que llenar toda la tabla es más trabajo. Agrega objetos (o una mochila más grande) y mira cómo se dispara: sus llamadas casi se duplican con cada objeto.`,
    manyItems: (answer, repeats, table) =>
      `La misma respuesta, ${answer}, de las tres formas. La recursión simple calculó ${repeats} subproblemas que ya había resuelto; la tabla calculó cada una de sus ${table} celdas una sola vez, y la memoización solo tocó las que necesita la respuesta.`,
  },
});


const format = (n: number) => n.toLocaleString("en-US");
/** Subproblems worked out again: plain recursion's wasted effort. */
const repeats = (work: KnapsackWork, upTo = work.length - 1) =>
  work.calls.slice(0, upTo + 1).filter((c) => c.repeat && !c.cached).length;

const WorkCanvas = ({ work, clock, label }: { work: KnapsackWork; clock: number; label: string }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<DpWorkRenderer | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    const renderer = new DpWorkRenderer(canvasRef.current!);
    rendererRef.current = renderer;
    return () => renderer.destroy();
  }, []);
  useEffect(() => rendererRef.current?.resize(width, height, window.devicePixelRatio || 1), [width, height]);
  useEffect(() => rendererRef.current?.refreshColors(), [theme]);
  useEffect(() => rendererRef.current?.update({ work, clock }), [work, clock]);

  return (
    <div ref={wrapperRef} className="relative min-h-0 w-full flex-1">
      <canvas ref={canvasRef} role="img" aria-label={label} className="absolute inset-0 h-full w-full" />
    </div>
  );
};

const Lane = ({ work, clock, place }: { work: KnapsackWork; clock: number; place: number }) => {
  const end = work.length - 1;
  const finished = clock > 0 && clock >= end;
  const { title } = dpMethods[work.method];
  const calls = Math.min(clock, end) + 1;
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
          {text.calls(format(calls), calls === 1)}
        </span>
      </header>
      <WorkCanvas work={work} clock={clock} label={text.soFar(title, format(calls))} />
    </section>
  );
};

/** The same knapsack three ways, one subproblem per tick each. */
export const DpRaceLanes = () => {
  const { runs, clock, replay } = useStore(
    useShallow((s) => ({ runs: s.dp.raceRuns, clock: s.frameIndex, replay: s.play })),
  );
  // Fewer subproblems touched wins.
  const placeOf = (work: KnapsackWork) => 1 + runs.filter((o) => o.length < work.length).length;
  const finished = clock > 0 && runs.length > 0 && runs.every((r) => clock >= r.length - 1);
  const rows = runs.map((work) => ({ work, place: placeOf(work) })).sort((a, b) => a.place - b.place);
  const recursion = runs.find((r) => r.method === "recursion");
  const table = runs.find((r) => r.method === "table");

  return (
    <div data-tour="bars" className="relative flex min-h-0 flex-1">
      {/* Side by side on wide screens; stacked on phones. */}
      <div className="grid min-h-0 w-full grid-rows-3 gap-2 md:grid-cols-3 md:grid-rows-1 md:gap-3">
        {runs.map((work) => (
          <Lane key={work.method} work={work} clock={clock} place={placeOf(work)} />
        ))}
      </div>
      {finished && (
        <ResultsOverlay onReplay={replay}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-foreground/60">
                <th className="pb-2 font-normal">{text.place}</th>
                <th className="pb-2 font-normal">{text.method}</th>
                <th className="pb-2 text-right font-normal">{text.callsHeader}</th>
                <th className="pb-2 text-right font-normal">{text.repeats}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ work, place }) => (
                <tr key={work.method} className="border-t border-line/60">
                  <td className="py-2">
                    <PlaceBadge place={place} />
                  </td>
                  <td className="py-2 font-semibold">{dpMethods[work.method].short}</td>
                  <td className="py-2 text-right font-mono">{format(work.length)}</td>
                  <td className="py-2 text-right font-mono">{format(repeats(work))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recursion && table && recursion.length <= table.length && (
            <p className="text-sm text-foreground/80">{text.fewItems(recursion.answer)}</p>
          )}
          {recursion && table && recursion.length > table.length && (
            <p className="text-sm text-foreground/80">
              {text.manyItems(recursion.answer, format(repeats(recursion)), format(table.length))}
            </p>
          )}
        </ResultsOverlay>
      )}
    </div>
  );
};
