import { Explanation, type Link, Section } from "@/components/Article";
import { articleText } from "@/components/articleText";
import { PageLink } from "@/components/PageLink";
import { localized } from "@/i18n";
import type { Nav } from "@/modules/types";
import { pathAlgorithms, raceDescription } from "./algorithms";
import { pathPseudocode } from "./searches";
import { MUD_COST, type PathAlgorithm } from "./types";

const pathText = localized({
  en: {
    shortest: "Shortest path",
    cheapest: "Yes, the cheapest",
    inSteps: "Yes, in steps (ignores cost)",
    notGuaranteed: "Not guaranteed",
    usesCosts: "Uses cell costs",
    aroundMud: (cost: number) => `Yes: goes around mud (×${cost}) when cheaper`,
    sameCost: "No: every step counts the same",
    keepsIn: "Keeps cells to explore in",
    time: "Time",
    atAGlance: "At a glance",
    tryIt: "Try it",
    tryIntro: (cost: number) =>
      `Drag on the grid above to draw walls, switch the brush to mud to make some cells cost ${cost} steps, and drag the green start or the target to move them. Then compare with another search on the same grid:`,
    orRace: (race: Link) => <>Or {race("race them")} side by side.</>,
    moduleTitle: "Pathfinding algorithms",
    moduleIntro:
      "Draw walls and mud on a grid, then watch five classic searches look for the way from start to target: some find the fewest steps, some the cheapest path, some just any path.",
    all: "All pathfinding algorithms",
    raceTitle: "Pathfinding algorithm race",
    raceIntro:
      "Put two to four searches on the same grid and see which one reaches the target first, and which one finds the better path.",
    raceTip:
      "Finishing first and finding the best path are different things. Greedy Best-First Search heads straight for the target and usually wins, but its path can be long. Dijkstra and A* always find the cheapest path, and A* looks at far fewer cells to do it. Add some mud with the brush and watch Breadth-First Search walk straight through it.",
    learnEach: "Learn each search",
  },
  es: {
    shortest: "Camino más corto",
    cheapest: "Sí, el más barato",
    inSteps: "Sí, en pasos (ignora el costo)",
    notGuaranteed: "No garantizado",
    usesCosts: "Usa el costo de las celdas",
    aroundMud: (cost) => `Sí: rodea el barro (×${cost}) cuando sale más barato`,
    sameCost: "No: todos los pasos cuentan igual",
    keepsIn: "Guarda las celdas por explorar en",
    time: "Tiempo",
    atAGlance: "De un vistazo",
    tryIt: "Pruébalo",
    tryIntro: (cost) =>
      `Arrastra sobre la cuadrícula de arriba para dibujar paredes, cambia el pincel a barro para que algunas celdas cuesten ${cost} pasos, y arrastra el inicio verde o el destino para moverlos. Después compara con otra búsqueda en la misma cuadrícula:`,
    orRace: (race) => <>O {race("hazlas competir")} lado a lado.</>,
    moduleTitle: "Algoritmos de búsqueda de caminos",
    moduleIntro:
      "Dibuja paredes y barro en una cuadrícula y mira cómo cinco búsquedas clásicas buscan el camino del inicio al destino: algunas encuentran el de menos pasos, otras el más barato y otras uno cualquiera.",
    all: "Todos los algoritmos de búsqueda de caminos",
    raceTitle: "Carrera de algoritmos de búsqueda de caminos",
    raceIntro:
      "Pon de dos a cuatro búsquedas en la misma cuadrícula y mira cuál llega primero al destino y cuál encuentra el mejor camino.",
    raceTip:
      "Terminar primero y encontrar el mejor camino son cosas distintas. La búsqueda voraz va directo al destino y suele ganar, pero su camino puede ser largo. Dijkstra y A* siempre encuentran el camino más barato, y A* revisa muchas menos celdas para lograrlo. Agrega barro con el pincel y mira cómo la búsqueda en anchura lo atraviesa sin desviarse.",
    learnEach: "Aprende cada búsqueda",
  },
});

const pathOrder = Object.keys(pathAlgorithms) as PathAlgorithm[];

/** The pathfinding algorithms, linking to their pages. */
const PathIndex = ({ current, onNavigate }: { current?: PathAlgorithm; onNavigate?: Nav["onNavigate"] }) => (
  <ul className="tap-rows flex flex-wrap gap-x-6 gap-y-2">
    {pathOrder.map((algorithm) => (
      <li key={algorithm}>
        {algorithm === current ? (
          <span className="font-semibold">{pathAlgorithms[algorithm].title}</span>
        ) : (
          <PageLink to={{ module: "pathfinding", page: "algorithm", algorithm }} onNavigate={onNavigate}>
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
      pathText.shortest,
      shortest === "cost" ? pathText.cheapest : shortest === "steps" ? pathText.inSteps : pathText.notGuaranteed,
    ],
    [pathText.usesCosts, weighted ? pathText.aroundMud(MUD_COST) : pathText.sameCost],
    [pathText.keepsIn, structure],
    [pathText.time, timeComplexity],
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

export const PathArticle = ({ algorithm, onNavigate }: { algorithm: PathAlgorithm; onNavigate?: Nav["onNavigate"] }) => {
  const { title, shortDescription, longDescription } = pathAlgorithms[algorithm];
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Explanation title={articleText.howItWorks(pathAlgorithms[algorithm].named)}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Explanation>
      <Section title={pathText.atAGlance}>
        <PathTable algorithm={algorithm} />
      </Section>
      <Explanation title={articleText.pseudocode}>
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {pathPseudocode[algorithm].join("\n")}
        </pre>
      </Explanation>
      <Section title={pathText.tryIt}>
        <p className="leading-relaxed text-foreground/80">{pathText.tryIntro(MUD_COST)}</p>
        <PathIndex current={algorithm} onNavigate={onNavigate} />
        <p className="text-foreground/80">
          {pathText.orRace((children) => (
            <PageLink to={{ module: "pathfinding", page: "race" }} onNavigate={onNavigate}>
              {children}
            </PageLink>
          ))}
        </p>
      </Section>
    </>
  );
};

export const PathfindingArticle = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{pathText.moduleTitle}</h1>
      <p className="text-lg text-foreground/80">{pathText.moduleIntro}</p>
    </header>
    <Section title={pathText.all}>
      <ul className="tap-rows flex flex-col divide-y divide-edge">
        {pathOrder.map((algorithm) => (
          <li key={algorithm} className="flex flex-col gap-1 py-4">
            <PageLink to={{ module: "pathfinding", page: "algorithm", algorithm }} onNavigate={onNavigate}>
              {pathAlgorithms[algorithm].title}
            </PageLink>
            <p className="text-sm text-foreground/75">{pathAlgorithms[algorithm].shortDescription}</p>
          </li>
        ))}
      </ul>
    </Section>
    <Section title={articleText.raceThem}>
      <p className="leading-relaxed text-foreground/80">
        {raceDescription}{" "}
        <PageLink to={{ module: "pathfinding", page: "race" }} onNavigate={onNavigate}>
          {articleText.startRace}
        </PageLink>
        .
      </p>
    </Section>
  </>
);

export const PathRaceArticle = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{pathText.raceTitle}</h1>
      <p className="text-lg text-foreground/80">{pathText.raceIntro}</p>
    </header>
    <Explanation title={articleText.howRaceWorks}>
      <p className="leading-relaxed text-foreground/80">{raceDescription}</p>
      <p className="leading-relaxed text-foreground/80">{pathText.raceTip}</p>
    </Explanation>
    <Section title={pathText.learnEach}>
      <PathIndex onNavigate={onNavigate} />
    </Section>
  </>
);

