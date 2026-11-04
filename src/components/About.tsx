import type { MouseEvent, ReactNode } from "react";
import { pseudocode } from "@/algorithms";
import { pathAlgorithms } from "@/consts/pathAlgorithms";
import { MUD_COST, pathPseudocode, type PathAlgorithm } from "@/pathfinding";
import { algorithmGroups } from "@/consts/algorithmGroups";
import { PATH_RACE_DESCRIPTION, RACE_DESCRIPTION } from "@/consts/race";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { routePath, type Route } from "@/routes";
import type { Algorithm } from "@/types";

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

const PageLink = ({
  to,
  onNavigate,
  children,
  className = "font-semibold underline decoration-line underline-offset-4 hover:decoration-foreground",
}: {
  to: Route;
  onNavigate?: Props["onNavigate"];
  children: ReactNode;
  className?: string;
}) => (
  <a
    href={routePath(to)}
    className={className}
    onClick={(event: MouseEvent) => {
      // Let modified clicks open a new tab as usual.
      if (!onNavigate || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      onNavigate(to);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }}
  >
    {children}
  </a>
);

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

const HomeArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">Algorithm visualizer</h1>
      <p className="text-lg text-foreground/80">
        Watch sorting algorithms put an array in order and pathfinding algorithms search a maze, one step at a time.
        Each step is explained in plain words next to the line of pseudocode it runs, and every run can be shared with
        a link.
      </p>
    </header>
    <Section title="Sorting algorithms">
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
    <Section title="Pathfinding algorithms">
      <p className="leading-relaxed text-foreground/80">
        Draw walls and mud on a grid, then watch five classic searches look for the way from start to target: some
        find the fewest steps, some the cheapest path, some just any path.
      </p>
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
        {RACE_DESCRIPTION}{" "}
        <PageLink to={{ kind: "race" }} onNavigate={onNavigate}>
          Race sorting algorithms
        </PageLink>
        .
      </p>
      <p className="leading-relaxed text-foreground/80">
        {PATH_RACE_DESCRIPTION}{" "}
        <PageLink to={{ kind: "pathRace" }} onNavigate={onNavigate}>
          Race pathfinding algorithms
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

export const About = ({ route, onNavigate }: Props) => (
  <article className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 pb-20 pt-16 text-foreground md:px-6">
    {route.kind === "home" && <HomeArticle onNavigate={onNavigate} />}
    {route.kind === "race" && <RaceArticle onNavigate={onNavigate} />}
    {route.kind === "algorithm" && <AlgorithmArticle algorithm={route.algorithm} onNavigate={onNavigate} />}
    {route.kind === "path" && <PathArticle algorithm={route.algorithm} onNavigate={onNavigate} />}
    {route.kind === "pathRace" && <PathRaceArticle onNavigate={onNavigate} />}
    <footer className="border-t border-edge pt-6 text-sm text-foreground/60">
      Made by Aleph Labs ·{" "}
      <a
        href="https://github.com/alephlabs-dev/algorithms"
        className="underline decoration-line underline-offset-4 hover:text-foreground"
      >
        Open source on GitHub
      </a>
    </footer>
  </article>
);
