import type { ReactNode } from "react";
import { pseudocode } from "@/algorithms";
import { graphAlgorithms } from "@/consts/graphAlgorithms";
import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { graphPseudocode, type GraphAlgorithm } from "@/graphs";
import { MUD_COST, pathPseudocode, type PathAlgorithm } from "@/pathfinding";
import { algorithmGroups } from "@/consts/algorithmGroups";
import { GRAPH_RACE_DESCRIPTION, PATH_RACE_DESCRIPTION, RACE_DESCRIPTION } from "@/consts/race";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
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

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-4">
    <h2 className="text-xl font-semibold">{title}</h2>
    {children}
  </section>
);

const ComplexityTable = ({ algorithm }: { algorithm: Algorithm }) => {
  const { timeComplexity, space, stable } = sortingAlgorithms[algorithm];
  const rows: [string, string][] = [
    ["Best case", timeComplexity.best],
    ["Average case", timeComplexity.average],
    ["Worst case", timeComplexity.worst],
    ["Extra memory", space],
    ["Stable", stable ? "Yes: equal values keep their order" : "No: equal values may swap places"],
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
      <Section title={`How ${title} works`}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Section>
      <Section title="Time and space complexity">
        <ComplexityTable algorithm={algorithm} />
      </Section>
      <Section title="Pseudocode">
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {pseudocode[algorithm].join("\n")}
        </pre>
        <p className="text-sm text-foreground/70">
          The visualizer above highlights each of these lines as it runs, with the step explained in plain words.
        </p>
      </Section>
      <Section title="Compare with other algorithms">
        <AlgorithmIndex current={algorithm} onNavigate={onNavigate} />
        <p className="text-foreground/80">
          Or put {title} in a{" "}
          <PageLink to={{ kind: "race" }} onNavigate={onNavigate}>
            race
          </PageLink>{" "}
          against others on the same array.
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
      <h1 className="text-display font-semibold">Sorting algorithms</h1>
      <p className="text-lg text-foreground/80">
        Watch nine sorting algorithms put an array in order, one comparison at a time. Each step is explained in plain
        words next to the line of pseudocode it runs, and every run can be shared with a link.
      </p>
    </header>
    <Section title="All sorting algorithms">
      <ul className="flex flex-col divide-y divide-edge">
        {(Object.keys(sortingAlgorithms) as Algorithm[]).map((algorithm) => {
          const { title, shortDescription, timeComplexity } = sortingAlgorithms[algorithm];
          return (
            <li key={algorithm} className="flex flex-col gap-1 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <PageLink to={{ kind: "algorithm", algorithm }} onNavigate={onNavigate}>
                  {title}
                </PageLink>
                <span className="font-mono text-xs text-foreground/60">{timeComplexity.average} average</span>
              </div>
              <p className="text-sm text-foreground/75">{shortDescription}</p>
            </li>
          );
        })}
      </ul>
    </Section>
    <Section title="Race them">
      <p className="leading-relaxed text-foreground/80">
        {RACE_DESCRIPTION}{" "}
        <PageLink to={{ kind: "race" }} onNavigate={onNavigate}>
          Start a race
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
      <h1 className="text-display font-semibold">Sorting algorithm race</h1>
      <p className="text-lg text-foreground/80">
        Put two to four sorting algorithms side by side on the same array and see which one finishes first.
      </p>
    </header>
    <Section title="How the race works">
      <p className="leading-relaxed text-foreground/80">{RACE_DESCRIPTION}</p>
      <p className="leading-relaxed text-foreground/80">
        Try a nearly sorted array to see Insertion Sort beat Quick Sort, or a reversed one to see which algorithms
        struggle with their worst case.
      </p>
    </Section>
    <Section title="Learn each algorithm">
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
    <footer className="border-t border-edge pt-6 text-sm text-foreground/60">
      <PageLink
        to={{ kind: "home" }}
        onNavigate={onNavigate}
        className="underline decoration-line underline-offset-4 hover:text-foreground"
      >
        All modules
      </PageLink>{" "}
      · Made by Aleph Labs ·{" "}
      <a
        href="https://github.com/alephlabs-dev/algorithms"
        className="underline decoration-line underline-offset-4 hover:text-foreground"
      >
        Open source on GitHub
      </a>
    </footer>
  </article>
);
