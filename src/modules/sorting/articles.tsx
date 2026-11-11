import { Explanation, type Link, Section } from "@/components/Article";
import { articleText } from "@/components/articleText";
import { PageLink } from "@/components/PageLink";
import { localized } from "@/i18n";
import type { Nav } from "@/modules/types";
import { algorithmGroups } from "./algorithmGroups";
import { raceDescription, sortingAlgorithms } from "./algorithms";
import { pseudocode } from "./generators";
import type { Algorithm } from "./types";

const text = localized({
  en: {
    bestCase: "Best case",
    averageCase: "Average case",
    worstCase: "Worst case",
    extraMemory: "Extra memory",
    stable: "Stable",
    stableYes: "Yes: equal values keep their order",
    stableNo: "No: equal values may swap places",
    complexity: "Time and space complexity",
    pseudocodeNote: "The visualizer above highlights each of these lines as it runs, with the step explained in plain words.",
    compare: "Compare with other algorithms",
    orRace: (title: string, race: Link) => (
      <>
        Or put {title} in a {race("race")} against others on the same array.
      </>
    ),
    sortingTitle: "Sorting algorithms",
    sortingIntro:
      "Watch nine sorting algorithms put an array in order, one comparison at a time. Each step is explained in plain words next to the line of pseudocode it runs, and every run can be shared with a link.",
    allSorting: "All sorting algorithms",
    average: (o: string) => `${o} average`,
    raceTitle: "Sorting algorithm race",
    raceIntro: "Put two to four sorting algorithms side by side on the same array and see which one finishes first.",
    raceTip:
      "Try a nearly sorted array to see Insertion Sort beat Quick Sort, or a reversed one to see which algorithms struggle with their worst case.",
  },
  es: {
    bestCase: "Mejor caso",
    averageCase: "Caso promedio",
    worstCase: "Peor caso",
    extraMemory: "Memoria extra",
    stable: "Estable",
    stableYes: "Sí: los valores iguales mantienen su orden",
    stableNo: "No: los valores iguales pueden cambiar de lugar",
    complexity: "Complejidad en tiempo y espacio",
    pseudocodeNote:
      "El visualizador de arriba resalta cada una de estas líneas mientras se ejecuta y explica el paso con palabras simples.",
    compare: "Compara con otros algoritmos",
    orRace: (title, race) => (
      <>
        O pon a {title} en una {race("carrera")} contra otros con el mismo arreglo.
      </>
    ),
    sortingTitle: "Algoritmos de ordenamiento",
    sortingIntro:
      "Mira cómo nueve algoritmos de ordenamiento ponen un arreglo en orden, comparación por comparación. Cada paso se explica con palabras simples junto a la línea de pseudocódigo que ejecuta, y cada ejecución se puede compartir con un enlace.",
    allSorting: "Todos los algoritmos de ordenamiento",
    average: (o) => `${o} en promedio`,
    raceTitle: "Carrera de algoritmos de ordenamiento",
    raceIntro: "Pon de dos a cuatro algoritmos de ordenamiento lado a lado con el mismo arreglo y mira cuál termina primero.",
    raceTip:
      "Prueba un arreglo casi ordenado para ver a Insertion Sort ganarle a Quick Sort, o uno invertido para ver qué algoritmos sufren con su peor caso.",
  },
});

const ComplexityTable = ({ algorithm }: { algorithm: Algorithm }) => {
  const { timeComplexity, space, stable } = sortingAlgorithms[algorithm];
  const rows: [string, string][] = [
    [text.bestCase, timeComplexity.best],
    [text.averageCase, timeComplexity.average],
    [text.worstCase, timeComplexity.worst],
    [text.extraMemory, space],
    [text.stable, stable ? text.stableYes : text.stableNo],
  ];
  return (
    <table className="w-full max-w-lg text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-edge last:border-0">
            <th scope="row" className="py-2.5 pr-6 text-left font-normal text-foreground/70">
              {label}
            </th>
            <td className="py-2.5 font-mono">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/** Every algorithm grouped by how it scales, linking to its page. */
const AlgorithmIndex = ({ current, onNavigate }: { current?: Algorithm; onNavigate?: Nav["onNavigate"] }) => (
  <div className="grid gap-6 sm:grid-cols-3">
    {algorithmGroups.map((group) => (
      <div key={group.label} className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
          {group.label} <span className="font-mono normal-case tracking-normal">{group.hint}</span>
        </h3>
        <ul className="tap-rows flex flex-col gap-1.5">
          {group.algorithms.map((algorithm) => (
            <li key={algorithm}>
              {algorithm === current ? (
                <span className="font-semibold">{sortingAlgorithms[algorithm].title}</span>
              ) : (
                <PageLink to={{ module: "sorting", page: "algorithm", algorithm }} onNavigate={onNavigate}>
                  {sortingAlgorithms[algorithm].title}
                </PageLink>
              )}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

export const AlgorithmArticle = ({ algorithm, onNavigate }: { algorithm: Algorithm; onNavigate?: Nav["onNavigate"] }) => {
  const { title, shortDescription, longDescription } = sortingAlgorithms[algorithm];
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Explanation title={articleText.howItWorks(title)}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Explanation>
      <Section title={text.complexity}>
        <ComplexityTable algorithm={algorithm} />
      </Section>
      <Explanation title={articleText.pseudocode}>
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {pseudocode[algorithm].join("\n")}
        </pre>
        <p className="text-sm text-foreground/70">{text.pseudocodeNote}</p>
      </Explanation>
      <Section title={text.compare}>
        <AlgorithmIndex current={algorithm} onNavigate={onNavigate} />
        <p className="text-foreground/80">
          {text.orRace(title, (children) => (
            <PageLink to={{ module: "sorting", page: "race" }} onNavigate={onNavigate}>
              {children}
            </PageLink>
          ))}
        </p>
      </Section>
    </>
  );
};

export const SortingArticle = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{text.sortingTitle}</h1>
      <p className="text-lg text-foreground/80">{text.sortingIntro}</p>
    </header>
    <Section title={text.allSorting}>
      <ul className="tap-rows flex flex-col divide-y divide-edge">
        {(Object.keys(sortingAlgorithms) as Algorithm[]).map((algorithm) => {
          const { title, shortDescription, timeComplexity } = sortingAlgorithms[algorithm];
          return (
            <li key={algorithm} className="flex flex-col gap-1 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <PageLink to={{ module: "sorting", page: "algorithm", algorithm }} onNavigate={onNavigate}>
                  {title}
                </PageLink>
                <span className="font-mono text-xs text-foreground/60">{text.average(timeComplexity.average)}</span>
              </div>
              <p className="text-sm text-foreground/75">{shortDescription}</p>
            </li>
          );
        })}
      </ul>
    </Section>
    <Section title={articleText.raceThem}>
      <p className="leading-relaxed text-foreground/80">
        {raceDescription}{" "}
        <PageLink to={{ module: "sorting", page: "race" }} onNavigate={onNavigate}>
          {articleText.startRace}
        </PageLink>
        .
      </p>
    </Section>
  </>
);

export const RaceArticle = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{text.raceTitle}</h1>
      <p className="text-lg text-foreground/80">{text.raceIntro}</p>
    </header>
    <Explanation title={articleText.howRaceWorks}>
      <p className="leading-relaxed text-foreground/80">{raceDescription}</p>
      <p className="leading-relaxed text-foreground/80">{text.raceTip}</p>
    </Explanation>
    <Section title={articleText.learnEach}>
      <AlgorithmIndex onNavigate={onNavigate} />
    </Section>
  </>
);

