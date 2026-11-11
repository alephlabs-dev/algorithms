import { Explanation, type Link, Section } from "@/components/Article";
import { articleText } from "@/components/articleText";
import { PageLink } from "@/components/PageLink";
import { localized } from "@/i18n";
import type { Nav } from "@/modules/types";
import { graphAlgorithms, raceDescription } from "./algorithms";
import { graphPseudocode } from "./searches";
import type { GraphAlgorithm } from "./types";

const graphText = localized({
  en: {
    badge: {
      distance: "Its distance from the start",
      order: "When it was visited",
      key: "The cheapest edge that would add it to the tree",
      group: "The group it's in, named by one of its nodes",
      indegree: "Edges still coming in; once placed, its place in the order",
    },
    moduleTitle: "Graph algorithms",
    moduleIntro:
      "A graph is a set of nodes joined by edges: cities and roads, people and friendships, pages and links. Watch six classic algorithms walk one, build its lightest tree or put it in order, with every step shown.",
    all: "All graph algorithms",
    makeYourOwn: "Make your own",
    makeIntro:
      "Drag nodes to move them, tap two nodes to join or split them, and double-tap a node to start from it. Or pick a ready-made network, tree, grid or DAG (a directed graph without loops).",
    keepsIn: "Keeps the nodes to visit in",
    badgeRow: "The badge on each node",
    usesWeights: "Uses edge weights",
    cheapestRoute: "Yes: the cheapest route, not the fewest edges",
    sameEdge: "No: every edge counts the same",
    time: "Time",
    atAGlance: "At a glance",
    compare: "Compare",
    runAnother: "Run another algorithm on the same graph:",
    orRace: (race: Link) => <>Or {race("race them")} side by side.</>,
    raceTitle: "Graph algorithm race",
    raceIntro: "Put two to four graph algorithms side by side on the same graph and see which one has the least to do.",
    raceTip:
      "Breadth-first and depth-first search look at the same edges in a different order. Prim grows one tree from the start while Kruskal merges many small ones; on a graph with lots of edges, Kruskal spends its steps skipping the ones that would close a loop.",
  },
  es: {
    badge: {
      distance: "Su distancia desde el inicio",
      order: "Cuándo se visitó",
      key: "La arista más barata que lo sumaría al árbol",
      group: "El grupo en el que está, con el nombre de uno de sus nodos",
      indegree: "Las aristas que todavía le entran; una vez ubicado, su lugar en el orden",
    },
    moduleTitle: "Algoritmos de grafos",
    moduleIntro:
      "Un grafo es un conjunto de nodos unidos por aristas: ciudades y rutas, personas y amistades, páginas y enlaces. Mira seis algoritmos clásicos recorrer uno, construir su árbol más liviano u ordenarlo, con cada paso a la vista.",
    all: "Todos los algoritmos de grafos",
    makeYourOwn: "Arma el tuyo",
    makeIntro:
      "Arrastra los nodos para moverlos, toca dos nodos para unirlos o separarlos y toca dos veces un nodo para empezar desde él. O elige una red, un árbol, una malla o un DAG (un grafo dirigido sin ciclos) ya hechos.",
    keepsIn: "Guarda los nodos por visitar en",
    badgeRow: "La etiqueta de cada nodo",
    usesWeights: "Usa el peso de las aristas",
    cheapestRoute: "Sí: la ruta más barata, no la de menos aristas",
    sameEdge: "No: todas las aristas cuentan igual",
    time: "Tiempo",
    atAGlance: "De un vistazo",
    compare: "Compara",
    runAnother: "Ejecuta otro algoritmo en el mismo grafo:",
    orRace: (race) => <>O {race("hazlos competir")} lado a lado.</>,
    raceTitle: "Carrera de algoritmos de grafos",
    raceIntro: "Pon de dos a cuatro algoritmos de grafos lado a lado en el mismo grafo y mira cuál tiene menos trabajo.",
    raceTip:
      "La búsqueda en anchura y la búsqueda en profundidad miran las mismas aristas en otro orden. Prim hace crecer un árbol desde el inicio mientras Kruskal une muchos pequeños; en un grafo con muchas aristas, Kruskal gasta sus pasos descartando las que cerrarían un ciclo.",
  },
});

const graphOrder = Object.keys(graphAlgorithms) as GraphAlgorithm[];

const BADGE_MEANING = graphText.badge;

/** The graph algorithms, linking to their pages. */
const GraphIndex = ({ current, onNavigate }: { current?: GraphAlgorithm; onNavigate?: Nav["onNavigate"] }) => (
  <ul className="tap-rows flex flex-wrap gap-x-6 gap-y-2">
    {graphOrder.map((algorithm) => (
      <li key={algorithm}>
        {algorithm === current ? (
          <span className="font-semibold">{graphAlgorithms[algorithm].title}</span>
        ) : (
          <PageLink to={{ module: "graphs", page: "algorithm", algorithm }} onNavigate={onNavigate}>
            {graphAlgorithms[algorithm].title}
          </PageLink>
        )}
      </li>
    ))}
  </ul>
);

export const GraphsArticle = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{graphText.moduleTitle}</h1>
      <p className="text-lg text-foreground/80">{graphText.moduleIntro}</p>
    </header>
    <Section title={graphText.all}>
      <ul className="tap-rows flex flex-col divide-y divide-edge">
        {graphOrder.map((algorithm) => (
          <li key={algorithm} className="flex flex-col gap-1 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <PageLink to={{ module: "graphs", page: "algorithm", algorithm }} onNavigate={onNavigate}>
                {graphAlgorithms[algorithm].title}
              </PageLink>
              <span className="font-mono text-xs text-foreground/60">{graphAlgorithms[algorithm].structure}</span>
            </div>
            <p className="text-sm text-foreground/75">{graphAlgorithms[algorithm].shortDescription}</p>
          </li>
        ))}
      </ul>
    </Section>
    <Section title={articleText.raceThem}>
      <p className="leading-relaxed text-foreground/80">
        {raceDescription}{" "}
        <PageLink to={{ module: "graphs", page: "race" }} onNavigate={onNavigate}>
          {articleText.startRace}
        </PageLink>
        .
      </p>
    </Section>
    <Explanation title={graphText.makeYourOwn}>
      <p className="leading-relaxed text-foreground/80">{graphText.makeIntro}</p>
    </Explanation>
  </>
);

export const GraphArticle = ({ algorithm, onNavigate }: { algorithm: GraphAlgorithm; onNavigate?: Nav["onNavigate"] }) => {
  const { title, shortDescription, longDescription, structure, label, weighted, timeComplexity } =
    graphAlgorithms[algorithm];
  const rows: [string, string][] = [
    [graphText.keepsIn, structure],
    [graphText.badgeRow, BADGE_MEANING[label]],
    [graphText.usesWeights, weighted ? graphText.cheapestRoute : graphText.sameEdge],
    [graphText.time, timeComplexity],
  ];
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Explanation title={articleText.howItWorks(graphAlgorithms[algorithm].named)}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Explanation>
      <Section title={graphText.atAGlance}>
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
      <Explanation title={articleText.pseudocode}>
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {graphPseudocode[algorithm].join("\n")}
        </pre>
      </Explanation>
      <Section title={graphText.compare}>
        <p className="leading-relaxed text-foreground/80">{graphText.runAnother}</p>
        <GraphIndex current={algorithm} onNavigate={onNavigate} />
        <p className="text-foreground/80">
          {graphText.orRace((children) => (
            <PageLink to={{ module: "graphs", page: "race" }} onNavigate={onNavigate}>
              {children}
            </PageLink>
          ))}
        </p>
      </Section>
    </>
  );
};

export const GraphRaceArticle = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{graphText.raceTitle}</h1>
      <p className="text-lg text-foreground/80">{graphText.raceIntro}</p>
    </header>
    <Explanation title={articleText.howRaceWorks}>
      <p className="leading-relaxed text-foreground/80">{raceDescription}</p>
      <p className="leading-relaxed text-foreground/80">{graphText.raceTip}</p>
    </Explanation>
    <Section title={articleText.learnEach}>
      <GraphIndex onNavigate={onNavigate} />
    </Section>
  </>
);

