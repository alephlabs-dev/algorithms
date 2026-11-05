import type { ReactNode } from "react";
import { pseudocode } from "@/algorithms";
import { dpProblems } from "@/consts/dp";
import { dpPseudocode, type DpAlgorithm } from "@/dp";
import { fourierSeries } from "@/consts/fourierSeries";
import { DP_RACE_DESCRIPTION, STRUCTURE_RACE_DESCRIPTION } from "@/consts/race";
import { structures } from "@/consts/structures";
import { structurePseudocode, type StructureAlgorithm } from "@/structures";
import { graphAlgorithms } from "@/consts/graphAlgorithms";
import { fourierPseudocode, type FourierAlgorithm } from "@/fourier";
import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { graphPseudocode, type GraphAlgorithm } from "@/graphs";
import { MUD_COST, pathPseudocode, type PathAlgorithm } from "@/pathfinding";
import { algorithmGroups } from "@/consts/algorithmGroups";
import { GRAPH_RACE_DESCRIPTION, PATH_RACE_DESCRIPTION, RACE_DESCRIPTION } from "@/consts/race";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { localized } from "@/i18n";
import type { Route } from "@/routes";
import type { Algorithm } from "@/types";
import { PageLink } from "./PageLink";

/**
 * The page's written content, below the visualizer: what search engines index
 * and what readers scroll to for the details. Pure (no store, no browser
 * APIs), because the build also renders it to static HTML for each page.
 */

type Props = {
  route: Route;
  /** In the app, links switch pages without reloading; in static HTML they're plain links. */
  onNavigate?: (route: Route) => void;
};

type Link = (children: ReactNode) => ReactNode;

// Sorting's articles and the footer. Other modules are translated in their own sub-issues of #36.
const text = localized({
  en: {
    bestCase: "Best case",
    averageCase: "Average case",
    worstCase: "Worst case",
    extraMemory: "Extra memory",
    stable: "Stable",
    stableYes: "Yes: equal values keep their order",
    stableNo: "No: equal values may swap places",
    howItWorks: (title: string) => `How ${title} works`,
    complexity: "Time and space complexity",
    pseudocode: "Pseudocode",
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
    raceThem: "Race them",
    startRace: "Start a race",
    raceTitle: "Sorting algorithm race",
    raceIntro: "Put two to four sorting algorithms side by side on the same array and see which one finishes first.",
    howRaceWorks: "How the race works",
    raceTip:
      "Try a nearly sorted array to see Insertion Sort beat Quick Sort, or a reversed one to see which algorithms struggle with their worst case.",
    learnEach: "Learn each algorithm",
    allModules: "All modules",
    madeBy: "Made by Aleph Labs",
    github: "Open source on GitHub",
  },
  es: {
    bestCase: "Mejor caso",
    averageCase: "Caso promedio",
    worstCase: "Peor caso",
    extraMemory: "Memoria extra",
    stable: "Estable",
    stableYes: "Sí: los valores iguales mantienen su orden",
    stableNo: "No: los valores iguales pueden cambiar de lugar",
    howItWorks: (title) => `Cómo funciona ${title}`,
    complexity: "Complejidad en tiempo y espacio",
    pseudocode: "Pseudocódigo",
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
    raceThem: "Hazlos competir",
    startRace: "Empieza una carrera",
    raceTitle: "Carrera de algoritmos de ordenamiento",
    raceIntro: "Pon de dos a cuatro algoritmos de ordenamiento lado a lado con el mismo arreglo y mira cuál termina primero.",
    howRaceWorks: "Cómo funciona la carrera",
    raceTip:
      "Prueba un arreglo casi ordenado para ver a Insertion Sort ganarle a Quick Sort, o uno invertido para ver qué algoritmos sufren con su peor caso.",
    learnEach: "Aprende cada algoritmo",
    allModules: "Todos los módulos",
    madeBy: "Hecho por Aleph Labs",
    github: "Código abierto en GitHub",
  },
});

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-4">
    <h2 className="text-xl font-semibold">{title}</h2>
    {children}
  </section>
);

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
const AlgorithmIndex = ({ current, onNavigate }: { current?: Algorithm; onNavigate?: Props["onNavigate"] }) => (
  <div className="grid gap-6 sm:grid-cols-3">
    {algorithmGroups.map((group) => (
      <div key={group.label} className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
          {group.label} <span className="font-mono normal-case tracking-normal">{group.hint}</span>
        </h3>
        <ul className="flex flex-col gap-1.5">
          {group.algorithms.map((algorithm) => (
            <li key={algorithm}>
              {algorithm === current ? (
                <span className="font-semibold">{sortingAlgorithms[algorithm].title}</span>
              ) : (
                <PageLink to={{ kind: "algorithm", algorithm }} onNavigate={onNavigate}>
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

const AlgorithmArticle = ({ algorithm, onNavigate }: { algorithm: Algorithm; onNavigate?: Props["onNavigate"] }) => {
  const { title, shortDescription, longDescription } = sortingAlgorithms[algorithm];
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Section title={text.howItWorks(title)}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Section>
      <Section title={text.complexity}>
        <ComplexityTable algorithm={algorithm} />
      </Section>
      <Section title={text.pseudocode}>
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {pseudocode[algorithm].join("\n")}
        </pre>
        <p className="text-sm text-foreground/70">{text.pseudocodeNote}</p>
      </Section>
      <Section title={text.compare}>
        <AlgorithmIndex current={algorithm} onNavigate={onNavigate} />
        <p className="text-foreground/80">
          {text.orRace(title, (children) => (
            <PageLink to={{ kind: "race" }} onNavigate={onNavigate}>
              {children}
            </PageLink>
          ))}
        </p>
      </Section>
    </>
  );
};

const pathOrder = Object.keys(pathAlgorithms) as PathAlgorithm[];

/** The pathfinding algorithms, linking to their pages. */
const PathIndex = ({ current, onNavigate }: { current?: PathAlgorithm; onNavigate?: Props["onNavigate"] }) => (
  <ul className="flex flex-wrap gap-x-6 gap-y-2">
    {pathOrder.map((algorithm) => (
      <li key={algorithm}>
        {algorithm === current ? (
          <span className="font-semibold">{pathAlgorithms[algorithm].title}</span>
        ) : (
          <PageLink to={{ kind: "path", algorithm }} onNavigate={onNavigate}>
            {pathAlgorithms[algorithm].title}
          </PageLink>
        )}
      </li>
    ))}
  </ul>
);

const PathTable = ({ algorithm }: { algorithm: PathAlgorithm }) => {
  const { structure, shortest, weighted, timeComplexity } = pathAlgorithms[algorithm];
  const rows: [string, string][] = [
    [
      "Shortest path",
      shortest === "cost" ? "Yes, the cheapest" : shortest === "steps" ? "Yes, in steps (ignores cost)" : "Not guaranteed",
    ],
    ["Uses cell costs", weighted ? `Yes: goes around mud (×${MUD_COST}) when cheaper` : "No: every step counts the same"],
    ["Keeps cells to explore in", structure],
    ["Time", timeComplexity],
  ];
  return (
    <table className="w-full max-w-lg text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-edge last:border-0">
            <th scope="row" className="py-2.5 pr-6 text-left align-top font-normal text-foreground/70">
              {label}
            </th>
            <td className="py-2.5">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const PathArticle = ({ algorithm, onNavigate }: { algorithm: PathAlgorithm; onNavigate?: Props["onNavigate"] }) => {
  const { title, shortDescription, longDescription } = pathAlgorithms[algorithm];
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Section title={`How ${title} works`}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Section>
      <Section title="At a glance">
        <PathTable algorithm={algorithm} />
      </Section>
      <Section title="Pseudocode">
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {pathPseudocode[algorithm].join("\n")}
        </pre>
      </Section>
      <Section title="Try it">
        <p className="leading-relaxed text-foreground/80">
          Drag on the grid above to draw walls, switch the brush to mud to make some cells cost {MUD_COST} steps, and
          drag the green start or the target to move them. Then compare with another search on the same grid:
        </p>
        <PathIndex current={algorithm} onNavigate={onNavigate} />
        <p className="text-foreground/80">
          Or{" "}
          <PageLink to={{ kind: "pathRace" }} onNavigate={onNavigate}>
            race them
          </PageLink>{" "}
          side by side.
        </p>
      </Section>
    </>
  );
};

const SortingArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{text.sortingTitle}</h1>
      <p className="text-lg text-foreground/80">{text.sortingIntro}</p>
    </header>
    <Section title={text.allSorting}>
      <ul className="flex flex-col divide-y divide-edge">
        {(Object.keys(sortingAlgorithms) as Algorithm[]).map((algorithm) => {
          const { title, shortDescription, timeComplexity } = sortingAlgorithms[algorithm];
          return (
            <li key={algorithm} className="flex flex-col gap-1 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <PageLink to={{ kind: "algorithm", algorithm }} onNavigate={onNavigate}>
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
    <Section title={text.raceThem}>
      <p className="leading-relaxed text-foreground/80">
        {RACE_DESCRIPTION}{" "}
        <PageLink to={{ kind: "race" }} onNavigate={onNavigate}>
          {text.startRace}
        </PageLink>
        .
      </p>
    </Section>
  </>
);

const PathfindingArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">Pathfinding algorithms</h1>
      <p className="text-lg text-foreground/80">
        Draw walls and mud on a grid, then watch five classic searches look for the way from start to target: some
        find the fewest steps, some the cheapest path, some just any path.
      </p>
    </header>
    <Section title="All pathfinding algorithms">
      <ul className="flex flex-col divide-y divide-edge">
        {pathOrder.map((algorithm) => (
          <li key={algorithm} className="flex flex-col gap-1 py-4">
            <PageLink to={{ kind: "path", algorithm }} onNavigate={onNavigate}>
              {pathAlgorithms[algorithm].title}
            </PageLink>
            <p className="text-sm text-foreground/75">{pathAlgorithms[algorithm].shortDescription}</p>
          </li>
        ))}
      </ul>
    </Section>
    <Section title="Race them">
      <p className="leading-relaxed text-foreground/80">
        {PATH_RACE_DESCRIPTION}{" "}
        <PageLink to={{ kind: "pathRace" }} onNavigate={onNavigate}>
          Start a race
        </PageLink>
        .
      </p>
    </Section>
  </>
);

const RaceArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{text.raceTitle}</h1>
      <p className="text-lg text-foreground/80">{text.raceIntro}</p>
    </header>
    <Section title={text.howRaceWorks}>
      <p className="leading-relaxed text-foreground/80">{RACE_DESCRIPTION}</p>
      <p className="leading-relaxed text-foreground/80">{text.raceTip}</p>
    </Section>
    <Section title={text.learnEach}>
      <AlgorithmIndex onNavigate={onNavigate} />
    </Section>
  </>
);

const PathRaceArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">Pathfinding algorithm race</h1>
      <p className="text-lg text-foreground/80">
        Put two to four searches on the same grid and see which one reaches the target first, and which one finds the
        better path.
      </p>
    </header>
    <Section title="How the race works">
      <p className="leading-relaxed text-foreground/80">{PATH_RACE_DESCRIPTION}</p>
      <p className="leading-relaxed text-foreground/80">
        Finishing first and finding the best path are different things. Greedy Best-First Search heads straight for the
        target and usually wins, but its path can be long. Dijkstra and A* always find the cheapest path, and A* looks
        at far fewer cells to do it. Add some mud with the brush and watch Breadth-First Search walk straight through
        it.
      </p>
    </Section>
    <Section title="Learn each search">
      <PathIndex onNavigate={onNavigate} />
    </Section>
  </>
);

const graphOrder = Object.keys(graphAlgorithms) as GraphAlgorithm[];

const BADGE_MEANING = {
  distance: "Its distance from the start",
  order: "When it was visited",
  key: "The cheapest edge that would add it to the tree",
  group: "The group it's in, named by one of its nodes",
  indegree: "Edges still coming in; once placed, its place in the order",
};

/** The graph algorithms, linking to their pages. */
const GraphIndex = ({ current, onNavigate }: { current?: GraphAlgorithm; onNavigate?: Props["onNavigate"] }) => (
  <ul className="flex flex-wrap gap-x-6 gap-y-2">
    {graphOrder.map((algorithm) => (
      <li key={algorithm}>
        {algorithm === current ? (
          <span className="font-semibold">{graphAlgorithms[algorithm].title}</span>
        ) : (
          <PageLink to={{ kind: "graph", algorithm }} onNavigate={onNavigate}>
            {graphAlgorithms[algorithm].title}
          </PageLink>
        )}
      </li>
    ))}
  </ul>
);

const GraphsArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">Graph algorithms</h1>
      <p className="text-lg text-foreground/80">
        A graph is a set of nodes joined by edges: cities and roads, people and friendships, pages and links. Watch
        six classic algorithms walk one, build its lightest tree or put it in order, with every step shown.
      </p>
    </header>
    <Section title="All graph algorithms">
      <ul className="flex flex-col divide-y divide-edge">
        {graphOrder.map((algorithm) => (
          <li key={algorithm} className="flex flex-col gap-1 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <PageLink to={{ kind: "graph", algorithm }} onNavigate={onNavigate}>
                {graphAlgorithms[algorithm].title}
              </PageLink>
              <span className="font-mono text-xs text-foreground/60">{graphAlgorithms[algorithm].structure}</span>
            </div>
            <p className="text-sm text-foreground/75">{graphAlgorithms[algorithm].shortDescription}</p>
          </li>
        ))}
      </ul>
    </Section>
    <Section title="Race them">
      <p className="leading-relaxed text-foreground/80">
        {GRAPH_RACE_DESCRIPTION}{" "}
        <PageLink to={{ kind: "graphRace" }} onNavigate={onNavigate}>
          Start a race
        </PageLink>
        .
      </p>
    </Section>
    <Section title="Make your own">
      <p className="leading-relaxed text-foreground/80">
        Drag nodes to move them, tap two nodes to join or split them, and double-tap a node to start from it. Or pick
        a ready-made network, tree, grid or DAG (a directed graph without loops).
      </p>
    </Section>
  </>
);

const GraphArticle = ({ algorithm, onNavigate }: { algorithm: GraphAlgorithm; onNavigate?: Props["onNavigate"] }) => {
  const { title, shortDescription, longDescription, structure, label, weighted, timeComplexity } =
    graphAlgorithms[algorithm];
  const rows: [string, string][] = [
    ["Keeps the nodes to visit in", structure],
    ["The badge on each node", BADGE_MEANING[label]],
    ["Uses edge weights", weighted ? "Yes: the cheapest route, not the fewest edges" : "No: every edge counts the same"],
    ["Time", timeComplexity],
  ];
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Section title={`How ${title} works`}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Section>
      <Section title="At a glance">
        <table className="w-full max-w-lg text-sm">
          <tbody>
            {rows.map(([name, value]) => (
              <tr key={name} className="border-b border-edge last:border-0">
                <th scope="row" className="py-2.5 pr-6 text-left align-top font-normal text-foreground/70">
                  {name}
                </th>
                <td className="py-2.5">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="Pseudocode">
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {graphPseudocode[algorithm].join("\n")}
        </pre>
      </Section>
      <Section title="Compare">
        <p className="leading-relaxed text-foreground/80">Run another algorithm on the same graph:</p>
        <GraphIndex current={algorithm} onNavigate={onNavigate} />
        <p className="text-foreground/80">
          Or{" "}
          <PageLink to={{ kind: "graphRace" }} onNavigate={onNavigate}>
            race them
          </PageLink>{" "}
          side by side.
        </p>
      </Section>
    </>
  );
};

const GraphRaceArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">Graph algorithm race</h1>
      <p className="text-lg text-foreground/80">
        Put two to four graph algorithms side by side on the same graph and see which one has the least to do.
      </p>
    </header>
    <Section title="How the race works">
      <p className="leading-relaxed text-foreground/80">{GRAPH_RACE_DESCRIPTION}</p>
      <p className="leading-relaxed text-foreground/80">
        Breadth-first and depth-first search look at the same edges in a different order. Prim grows one tree from the
        start while Kruskal merges many small ones; on a graph with lots of edges, Kruskal spends its steps skipping
        the ones that would close a loop.
      </p>
    </Section>
    <Section title="Learn each algorithm">
      <GraphIndex onNavigate={onNavigate} />
    </Section>
  </>
);

const seriesOrder = Object.keys(fourierSeries) as FourierAlgorithm[];

const FourierArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">Fourier series</h1>
      <p className="text-lg text-foreground/80">
        Any repeating wave, and any closed drawing, can be built from circles turning at whole-number speeds. Watch
        them add up, and see how the fit improves with every circle you add.
      </p>
    </header>
    <Section title="All series">
      <ul className="flex flex-col divide-y divide-edge">
        {seriesOrder.map((algorithm) => (
          <li key={algorithm} className="flex flex-col gap-1 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <PageLink to={{ kind: "series", algorithm }} onNavigate={onNavigate}>
                {fourierSeries[algorithm].title}
              </PageLink>
              <span className="font-mono text-xs text-foreground/60">{fourierSeries[algorithm].speeds}</span>
            </div>
            <p className="text-sm text-foreground/75">{fourierSeries[algorithm].shortDescription}</p>
          </li>
        ))}
      </ul>
    </Section>
    <Section title="Why circles?">
      <p className="leading-relaxed text-foreground/80">
        A circle turning at a steady speed is the simplest repeating motion there is, and its height over time is a
        sine. Joseph Fourier showed in 1807 that repeating signals can be written as sums of sines; stacking each one
        as a circle on the tip of the last turns that sum into something you can watch. The same idea is behind JPEG
        images, MP3 audio and how phones tell voices apart.
      </p>
    </Section>
  </>
);

const SeriesArticle = ({ algorithm, onNavigate }: { algorithm: FourierAlgorithm; onNavigate?: Props["onNavigate"] }) => {
  const { title, shortDescription, longDescription, formula } = fourierSeries[algorithm];
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Section title="How it works">
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Section>
      <Section title="The series">
        <p className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[15px]">{formula}</p>
      </Section>
      <Section title="Pseudocode">
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {fourierPseudocode[algorithm].join("\n")}
        </pre>
      </Section>
      <Section title="More series">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {seriesOrder.map((other) => (
            <li key={other}>
              {other === algorithm ? (
                <span className="font-semibold">{fourierSeries[other].title}</span>
              ) : (
                <PageLink to={{ kind: "series", algorithm: other }} onNavigate={onNavigate}>
                  {fourierSeries[other].title}
                </PageLink>
              )}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
};

const structureOrder = Object.keys(structures) as StructureAlgorithm[];

const StructureIndex = ({ current, onNavigate }: { current?: StructureAlgorithm; onNavigate?: Props["onNavigate"] }) => (
  <ul className="flex flex-wrap gap-x-6 gap-y-2">
    {structureOrder.map((algorithm) => (
      <li key={algorithm}>
        {algorithm === current ? (
          <span className="font-semibold">{structures[algorithm].title}</span>
        ) : (
          <PageLink to={{ kind: "structure", algorithm }} onNavigate={onNavigate}>
            {structures[algorithm].title}
          </PageLink>
        )}
      </li>
    ))}
  </ul>
);

const StructuresArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">Data structures</h1>
      <p className="text-lg text-foreground/80">
        Insert, search and delete, and watch each operation step by step: every comparison on the way down, every
        rotation a self-balancing tree makes to stay short, every swap in a heap and every slot a hash table probes.
      </p>
    </header>
    {(["Trees", "Heaps", "Hash tables"] as const).map((group) => (
      <Section key={group} title={group}>
        <ul className="flex flex-col divide-y divide-edge">
          {structureOrder
            .filter((algorithm) => structures[algorithm].group === group)
            .map((algorithm) => (
              <li key={algorithm} className="flex flex-col gap-1 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <PageLink to={{ kind: "structure", algorithm }} onNavigate={onNavigate}>
                    {structures[algorithm].title}
                  </PageLink>
                  <span className="font-mono text-xs text-foreground/60">{structures[algorithm].cost}</span>
                </div>
                <p className="text-sm text-foreground/75">{structures[algorithm].shortDescription}</p>
              </li>
            ))}
        </ul>
      </Section>
    ))}
    <Section title="Race the trees">
      <p className="leading-relaxed text-foreground/80">
        {STRUCTURE_RACE_DESCRIPTION}{" "}
        <PageLink to={{ kind: "structureRace" }} onNavigate={onNavigate}>
          Start a race
        </PageLink>
        .
      </p>
    </Section>
  </>
);

const StructureArticle = ({ algorithm, onNavigate }: { algorithm: StructureAlgorithm; onNavigate?: Props["onNavigate"] }) => {
  const { title, shortDescription, longDescription, cost, shape, shapeLabel } = structures[algorithm];
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Section
        title={`How ${/^[AEIOU]/.test(title) ? "an" : "a"} ${title.replace(/ \(.*\)$/, "").toLowerCase().replace("avl", "AVL")} works`}
      >
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Section>
      <Section title="At a glance">
        <table className="w-full max-w-lg text-sm">
          <tbody>
            {(
              [
                ["Search, insert, delete", cost],
                [shapeLabel, shape],
              ] as const
            ).map(([name, value]) => (
              <tr key={name} className="border-b border-edge last:border-0">
                <th scope="row" className="py-2.5 pr-6 text-left align-top font-normal text-foreground/70">
                  {name}
                </th>
                <td className="py-2.5">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="Pseudocode">
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {structurePseudocode[algorithm].join("\n")}
        </pre>
      </Section>
      <Section title="Compare">
        <StructureIndex current={algorithm} onNavigate={onNavigate} />
        <p className="text-foreground/80">
          Or{" "}
          <PageLink to={{ kind: "structureRace" }} onNavigate={onNavigate}>
            race the two search trees
          </PageLink>{" "}
          on the same values.
        </p>
      </Section>
    </>
  );
};

const StructureRaceArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">BST vs AVL tree</h1>
      <p className="text-lg text-foreground/80">
        The same values into a plain binary search tree and an AVL tree, side by side, one step per tick.
      </p>
    </header>
    <Section title="Why balancing matters">
      <p className="leading-relaxed text-foreground/80">{STRUCTURE_RACE_DESCRIPTION}</p>
      <p className="leading-relaxed text-foreground/80">
        A binary search tree is only as fast as it is short. Values arriving in sorted order (timestamps, ids, a sorted
        list) all go to the same side, and the tree becomes a list. An AVL tree pays a few rotations per insert to keep
        its height near log₂ n, so searching a million values takes about 20 steps instead of a million.
      </p>
    </Section>
    <Section title="Learn each tree">
      <StructureIndex onNavigate={onNavigate} />
    </Section>
  </>
);


const dpOrder = Object.keys(dpProblems) as DpAlgorithm[];

const DpArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">Dynamic programming</h1>
      <p className="text-lg text-foreground/80">
        Big questions answered from small ones: a table where each cell is worked out from cells already filled in,
        so nothing is ever solved twice. Watch it fill for any two words, then walk back to the answer.
      </p>
    </header>
    <Section title="Problems">
      <ul className="flex flex-col divide-y divide-edge">
        {dpOrder.map((algorithm) => (
          <li key={algorithm} className="flex flex-col gap-1 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <PageLink to={{ kind: "dpProblem", algorithm }} onNavigate={onNavigate}>
                {dpProblems[algorithm].title}
              </PageLink>
              <span className="font-mono text-xs text-foreground/60">{dpProblems[algorithm].cost}</span>
            </div>
            <p className="text-sm text-foreground/75">{dpProblems[algorithm].shortDescription}</p>
          </li>
        ))}
      </ul>
    </Section>
    <Section title="Race the methods">
      <p className="leading-relaxed text-foreground/80">
        {DP_RACE_DESCRIPTION}{" "}
        <PageLink to={{ kind: "dpRace" }} onNavigate={onNavigate}>
          Start a race
        </PageLink>
        .
      </p>
    </Section>
    <Section title="Why a table">
      <p className="leading-relaxed text-foreground/80">
        Each problem breaks into smaller versions of itself: the answer for two words depends on the answers for the
        same words a letter shorter, and the best bag on the best smaller bags with one item fewer. Solved by plain recursion, those smaller questions come up again and again,
        and the work grows exponentially. Writing each answer down the first time, in a table filled in an order where
        everything a cell needs is already there, makes it m × n cells of constant work each.
      </p>
    </Section>
  </>
);

const DpRaceArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">Table vs recursion</h1>
      <p className="text-lg text-foreground/80">
        One knapsack, solved three ways side by side: the bottom-up table, memoized recursion and plain recursion.
      </p>
    </header>
    <Section title="What memoizing saves">
      <p className="leading-relaxed text-foreground/80">{DP_RACE_DESCRIPTION}</p>
      <p className="leading-relaxed text-foreground/80">
        Each lane is the table of subproblems, colored by how many times that method has worked each one out. Plain
        recursion lights the same cells up again and again; with more items its count roughly doubles per item, while
        the table only grows by one row.
      </p>
    </Section>
    <Section title="The problems">
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {dpOrder.map((algorithm) => (
          <li key={algorithm}>
            <PageLink to={{ kind: "dpProblem", algorithm }} onNavigate={onNavigate}>
              {dpProblems[algorithm].title}
            </PageLink>
          </li>
        ))}
      </ul>
    </Section>
  </>
);

const DpProblemArticle = ({ algorithm, onNavigate }: { algorithm: DpAlgorithm; onNavigate?: Props["onNavigate"] }) => {
  const { title, shortDescription, longDescription, cost, cell } = dpProblems[algorithm];
  const other = algorithm === "edit" ? "lcs" : "edit";
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Section title="How it works">
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Section>
      <Section title="At a glance">
        <table className="w-full max-w-lg text-sm">
          <tbody>
            {(
              [
                [algorithm === "knapsack" ? "Cost, for n items and a bag of W" : "Cost, for words of m and n letters", cost],
                ["Each cell holds", cell],
              ] as const
            ).map(([name, value]) => (
              <tr key={name} className="border-b border-edge last:border-0">
                <th scope="row" className="py-2.5 pr-6 text-left align-top font-normal text-foreground/70">
                  {name}
                </th>
                <td className="py-2.5">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="Pseudocode">
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {dpPseudocode[algorithm].join("\n")}
        </pre>
      </Section>
      <Section title="Compare">
        <p className="text-foreground/80">
          Same idea, different question:{" "}
          <PageLink to={{ kind: "dpProblem", algorithm: other }} onNavigate={onNavigate}>
            {dpProblems[other].title}
          </PageLink>
          . Or{" "}
          <PageLink to={{ kind: "dpRace" }} onNavigate={onNavigate}>
            race the table against plain recursion
          </PageLink>{" "}
          on a knapsack.
        </p>
      </Section>
    </>
  );
};

export const About = ({ route, onNavigate }: Props) => (
  <article id="about" className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 pb-20 pt-16 text-foreground md:px-6">
    {route.kind === "sorting" && <SortingArticle onNavigate={onNavigate} />}
    {route.kind === "pathfinding" && <PathfindingArticle onNavigate={onNavigate} />}
    {route.kind === "race" && <RaceArticle onNavigate={onNavigate} />}
    {route.kind === "algorithm" && <AlgorithmArticle algorithm={route.algorithm} onNavigate={onNavigate} />}
    {route.kind === "path" && <PathArticle algorithm={route.algorithm} onNavigate={onNavigate} />}
    {route.kind === "pathRace" && <PathRaceArticle onNavigate={onNavigate} />}
    {route.kind === "graphs" && <GraphsArticle onNavigate={onNavigate} />}
    {route.kind === "graph" && <GraphArticle algorithm={route.algorithm} onNavigate={onNavigate} />}
    {route.kind === "graphRace" && <GraphRaceArticle onNavigate={onNavigate} />}
    {route.kind === "fourier" && <FourierArticle onNavigate={onNavigate} />}
    {route.kind === "series" && <SeriesArticle algorithm={route.algorithm} onNavigate={onNavigate} />}
    {route.kind === "structures" && <StructuresArticle onNavigate={onNavigate} />}
    {route.kind === "structure" && <StructureArticle algorithm={route.algorithm} onNavigate={onNavigate} />}
    {route.kind === "structureRace" && <StructureRaceArticle onNavigate={onNavigate} />}
    {route.kind === "dp" && <DpArticle onNavigate={onNavigate} />}
    {route.kind === "dpProblem" && <DpProblemArticle algorithm={route.algorithm} onNavigate={onNavigate} />}
    {route.kind === "dpRace" && <DpRaceArticle onNavigate={onNavigate} />}
    <footer className="border-t border-edge pt-6 text-sm text-foreground/60">
      <PageLink
        to={{ kind: "home" }}
        onNavigate={onNavigate}
        className="underline decoration-line underline-offset-4 hover:text-foreground"
      >
        {text.allModules}
      </PageLink>{" "}
      · {text.madeBy} ·{" "}
      <a
        href="https://github.com/alephlabs-dev/algorithms"
        className="underline decoration-line underline-offset-4 hover:text-foreground"
      >
        {text.github}
      </a>
    </footer>
  </article>
);
