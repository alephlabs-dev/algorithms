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

const structureText = localized({
  en: {
    howItWorks: (title: string) =>
      `How ${/^[AEIOU]/.test(title) ? "an" : "a"} ${title.replace(/ \(.*\)$/, "").toLowerCase().replace("avl", "AVL")} works`,
    moduleTitle: "Data structures",
    moduleIntro:
      "Insert, search and delete, and watch each operation step by step: every comparison on the way down, every rotation a self-balancing tree makes to stay short, every swap in a heap and every slot a hash table probes.",
    groups: { Trees: "Trees", Heaps: "Heaps", "Hash tables": "Hash tables" },
    raceTrees: "Race the trees",
    searchInsertDelete: "Search, insert, delete",
    atAGlance: "At a glance",
    compare: "Compare",
    orRace: (race: Link) => <>Or {race("race the two search trees")} on the same values.</>,
    raceTitle: "BST vs AVL tree",
    raceIntro: "The same values into a plain binary search tree and an AVL tree, side by side, one step per tick.",
    whyBalancing: "Why balancing matters",
    raceTip:
      "A binary search tree is only as fast as it is short. Values arriving in sorted order (timestamps, ids, a sorted list) all go to the same side, and the tree becomes a list. An AVL tree pays a few rotations per insert to keep its height near log₂ n, so searching a million values takes about 20 steps instead of a million.",
    learnEach: "Learn each tree",
  },
  es: {
    howItWorks: (named) => `Cómo funciona ${named}`,
    moduleTitle: "Estructuras de datos",
    moduleIntro:
      "Inserta, busca y borra, y mira cada operación paso a paso: cada comparación en la bajada, cada rotación que hace un árbol autobalanceado para mantenerse bajo, cada intercambio en un montículo y cada casilla que sondea una tabla hash.",
    groups: { Trees: "Árboles", Heaps: "Montículos", "Hash tables": "Tablas hash" },
    raceTrees: "Haz competir a los árboles",
    searchInsertDelete: "Buscar, insertar, borrar",
    atAGlance: "De un vistazo",
    compare: "Compara",
    orRace: (race) => <>O {race("haz competir a los dos árboles de búsqueda")} con los mismos valores.</>,
    raceTitle: "BST contra árbol AVL",
    raceIntro: "Los mismos valores en un árbol binario de búsqueda simple y en un árbol AVL, lado a lado, un paso por tic.",
    whyBalancing: "Por qué importa balancear",
    raceTip:
      "Un árbol binario de búsqueda es tan rápido como bajo. Los valores que llegan ordenados (marcas de tiempo, ids, una lista ordenada) van todos al mismo lado, y el árbol se vuelve una lista. Un árbol AVL paga unas pocas rotaciones por inserción para mantener su altura cerca de log₂ n, así que buscar entre un millón de valores toma unos 20 pasos en lugar de un millón.",
    learnEach: "Aprende cada árbol",
  },
});

const dpText = localized({
  en: {
    moduleTitle: "Dynamic programming",
    moduleIntro:
      "Big questions answered from small ones: a table where each cell is worked out from cells already filled in, so nothing is ever solved twice. Watch it fill for any two words, then walk back to the answer.",
    problems: "Problems",
    raceMethods: "Race the methods",
    whyTable: "Why a table",
    whyTableText:
      "Each problem breaks into smaller versions of itself: the answer for two words depends on the answers for the same words a letter shorter, and the best bag on the best smaller bags with one item fewer. Solved by plain recursion, those smaller questions come up again and again, and the work grows exponentially. Writing each answer down the first time, in a table filled in an order where everything a cell needs is already there, makes it m × n cells of constant work each.",
    raceTitle: "Table vs recursion",
    raceIntro: "One knapsack, solved three ways side by side: the bottom-up table, memoized recursion and plain recursion.",
    whatMemoSaves: "What memoizing saves",
    raceTip:
      "Each lane is the table of subproblems, colored by how many times that method has worked each one out. Plain recursion lights the same cells up again and again; with more items its count roughly doubles per item, while the table only grows by one row.",
    theProblems: "The problems",
    howItWorks: "How it works",
    atAGlance: "At a glance",
    costKnapsack: "Cost, for n items and a bag of W",
    costWords: "Cost, for words of m and n letters",
    cellHolds: "Each cell holds",
    compare: "Compare",
    compareLine: (other: ReactNode, race: Link) => (
      <>
        Same idea, different question: {other}. Or {race("race the table against plain recursion")} on a knapsack.
      </>
    ),
  },
  es: {
    moduleTitle: "Programación dinámica",
    moduleIntro:
      "Preguntas grandes respondidas a partir de otras pequeñas: una tabla donde cada celda se calcula a partir de celdas ya llenas, así que nada se resuelve dos veces. Mira cómo se llena para dos palabras cualesquiera y después vuelve hasta la respuesta.",
    problems: "Problemas",
    raceMethods: "Haz competir los métodos",
    whyTable: "Por qué una tabla",
    whyTableText:
      "Cada problema se divide en versiones más pequeñas de sí mismo: la respuesta para dos palabras depende de las respuestas para las mismas palabras con una letra menos, y la mejor mochila de las mejores mochilas más pequeñas con un objeto menos. Con recursión simple, esas preguntas más pequeñas aparecen una y otra vez, y el trabajo crece exponencialmente. Anotar cada respuesta la primera vez, en una tabla que se llena en un orden donde todo lo que necesita una celda ya está calculado, lo reduce a m × n celdas de trabajo constante cada una.",
    raceTitle: "Tabla contra recursión",
    raceIntro:
      "Una mochila, resuelta de tres formas lado a lado: la tabla de abajo hacia arriba, la recursión con memoización y la recursión simple.",
    whatMemoSaves: "Lo que ahorra memorizar",
    raceTip:
      "Cada carril es la tabla de subproblemas, coloreada según cuántas veces ese método calculó cada uno. La recursión simple ilumina las mismas celdas una y otra vez; con más objetos su cuenta casi se duplica por objeto, mientras que la tabla solo crece una fila.",
    theProblems: "Los problemas",
    howItWorks: "Cómo funciona",
    atAGlance: "De un vistazo",
    costKnapsack: "Costo, para n objetos y una mochila de W",
    costWords: "Costo, para palabras de m y n letras",
    cellHolds: "Cada celda guarda",
    compare: "Compara",
    compareLine: (other, race) => (
      <>
        La misma idea, otra pregunta: {other}. O {race("haz competir la tabla contra la recursión simple")} con una mochila.
      </>
    ),
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

const PathArticle = ({ algorithm, onNavigate }: { algorithm: PathAlgorithm; onNavigate?: Props["onNavigate"] }) => {
  const { title, shortDescription, longDescription } = pathAlgorithms[algorithm];
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Section title={text.howItWorks(pathAlgorithms[algorithm].named)}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Section>
      <Section title={pathText.atAGlance}>
        <PathTable algorithm={algorithm} />
      </Section>
      <Section title={text.pseudocode}>
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {pathPseudocode[algorithm].join("\n")}
        </pre>
      </Section>
      <Section title={pathText.tryIt}>
        <p className="leading-relaxed text-foreground/80">{pathText.tryIntro(MUD_COST)}</p>
        <PathIndex current={algorithm} onNavigate={onNavigate} />
        <p className="text-foreground/80">
          {pathText.orRace((children) => (
            <PageLink to={{ kind: "pathRace" }} onNavigate={onNavigate}>
              {children}
            </PageLink>
          ))}
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
      <h1 className="text-display font-semibold">{pathText.moduleTitle}</h1>
      <p className="text-lg text-foreground/80">{pathText.moduleIntro}</p>
    </header>
    <Section title={pathText.all}>
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
    <Section title={text.raceThem}>
      <p className="leading-relaxed text-foreground/80">
        {PATH_RACE_DESCRIPTION}{" "}
        <PageLink to={{ kind: "pathRace" }} onNavigate={onNavigate}>
          {text.startRace}
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
      <h1 className="text-display font-semibold">{pathText.raceTitle}</h1>
      <p className="text-lg text-foreground/80">{pathText.raceIntro}</p>
    </header>
    <Section title={text.howRaceWorks}>
      <p className="leading-relaxed text-foreground/80">{PATH_RACE_DESCRIPTION}</p>
      <p className="leading-relaxed text-foreground/80">{pathText.raceTip}</p>
    </Section>
    <Section title={pathText.learnEach}>
      <PathIndex onNavigate={onNavigate} />
    </Section>
  </>
);

const graphOrder = Object.keys(graphAlgorithms) as GraphAlgorithm[];

const BADGE_MEANING = graphText.badge;

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
      <h1 className="text-display font-semibold">{graphText.moduleTitle}</h1>
      <p className="text-lg text-foreground/80">{graphText.moduleIntro}</p>
    </header>
    <Section title={graphText.all}>
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
    <Section title={text.raceThem}>
      <p className="leading-relaxed text-foreground/80">
        {GRAPH_RACE_DESCRIPTION}{" "}
        <PageLink to={{ kind: "graphRace" }} onNavigate={onNavigate}>
          {text.startRace}
        </PageLink>
        .
      </p>
    </Section>
    <Section title={graphText.makeYourOwn}>
      <p className="leading-relaxed text-foreground/80">{graphText.makeIntro}</p>
    </Section>
  </>
);

const GraphArticle = ({ algorithm, onNavigate }: { algorithm: GraphAlgorithm; onNavigate?: Props["onNavigate"] }) => {
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
      <Section title={text.howItWorks(graphAlgorithms[algorithm].named)}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Section>
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
      <Section title={text.pseudocode}>
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {graphPseudocode[algorithm].join("\n")}
        </pre>
      </Section>
      <Section title={graphText.compare}>
        <p className="leading-relaxed text-foreground/80">{graphText.runAnother}</p>
        <GraphIndex current={algorithm} onNavigate={onNavigate} />
        <p className="text-foreground/80">
          {graphText.orRace((children) => (
            <PageLink to={{ kind: "graphRace" }} onNavigate={onNavigate}>
              {children}
            </PageLink>
          ))}
        </p>
      </Section>
    </>
  );
};

const GraphRaceArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{graphText.raceTitle}</h1>
      <p className="text-lg text-foreground/80">{graphText.raceIntro}</p>
    </header>
    <Section title={text.howRaceWorks}>
      <p className="leading-relaxed text-foreground/80">{GRAPH_RACE_DESCRIPTION}</p>
      <p className="leading-relaxed text-foreground/80">{graphText.raceTip}</p>
    </Section>
    <Section title={text.learnEach}>
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
      <h1 className="text-display font-semibold">{structureText.moduleTitle}</h1>
      <p className="text-lg text-foreground/80">{structureText.moduleIntro}</p>
    </header>
    {(["Trees", "Heaps", "Hash tables"] as const).map((group) => (
      <Section key={group} title={structureText.groups[group]}>
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
    <Section title={structureText.raceTrees}>
      <p className="leading-relaxed text-foreground/80">
        {STRUCTURE_RACE_DESCRIPTION}{" "}
        <PageLink to={{ kind: "structureRace" }} onNavigate={onNavigate}>
          {text.startRace}
        </PageLink>
        .
      </p>
    </Section>
  </>
);

const StructureArticle = ({ algorithm, onNavigate }: { algorithm: StructureAlgorithm; onNavigate?: Props["onNavigate"] }) => {
  const { title, named, shortDescription, longDescription, cost, shape, shapeLabel } = structures[algorithm];
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Section title={structureText.howItWorks(named)}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Section>
      <Section title={structureText.atAGlance}>
        <table className="w-full max-w-lg text-sm">
          <tbody>
            {(
              [
                [structureText.searchInsertDelete, cost],
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
      <Section title={text.pseudocode}>
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {structurePseudocode[algorithm].join("\n")}
        </pre>
      </Section>
      <Section title={structureText.compare}>
        <StructureIndex current={algorithm} onNavigate={onNavigate} />
        <p className="text-foreground/80">
          {structureText.orRace((children) => (
            <PageLink to={{ kind: "structureRace" }} onNavigate={onNavigate}>
              {children}
            </PageLink>
          ))}
        </p>
      </Section>
    </>
  );
};

const StructureRaceArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{structureText.raceTitle}</h1>
      <p className="text-lg text-foreground/80">{structureText.raceIntro}</p>
    </header>
    <Section title={structureText.whyBalancing}>
      <p className="leading-relaxed text-foreground/80">{STRUCTURE_RACE_DESCRIPTION}</p>
      <p className="leading-relaxed text-foreground/80">{structureText.raceTip}</p>
    </Section>
    <Section title={structureText.learnEach}>
      <StructureIndex onNavigate={onNavigate} />
    </Section>
  </>
);


const dpOrder = Object.keys(dpProblems) as DpAlgorithm[];

const DpArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{dpText.moduleTitle}</h1>
      <p className="text-lg text-foreground/80">{dpText.moduleIntro}</p>
    </header>
    <Section title={dpText.problems}>
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
    <Section title={dpText.raceMethods}>
      <p className="leading-relaxed text-foreground/80">
        {DP_RACE_DESCRIPTION}{" "}
        <PageLink to={{ kind: "dpRace" }} onNavigate={onNavigate}>
          {text.startRace}
        </PageLink>
        .
      </p>
    </Section>
    <Section title={dpText.whyTable}>
      <p className="leading-relaxed text-foreground/80">{dpText.whyTableText}</p>
    </Section>
  </>
);

const DpRaceArticle = ({ onNavigate }: { onNavigate?: Props["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{dpText.raceTitle}</h1>
      <p className="text-lg text-foreground/80">{dpText.raceIntro}</p>
    </header>
    <Section title={dpText.whatMemoSaves}>
      <p className="leading-relaxed text-foreground/80">{DP_RACE_DESCRIPTION}</p>
      <p className="leading-relaxed text-foreground/80">{dpText.raceTip}</p>
    </Section>
    <Section title={dpText.theProblems}>
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
      <Section title={dpText.howItWorks}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Section>
      <Section title={dpText.atAGlance}>
        <table className="w-full max-w-lg text-sm">
          <tbody>
            {(
              [
                [algorithm === "knapsack" ? dpText.costKnapsack : dpText.costWords, cost],
                [dpText.cellHolds, cell],
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
      <Section title={text.pseudocode}>
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {dpPseudocode[algorithm].join("\n")}
        </pre>
      </Section>
      <Section title={dpText.compare}>
        <p className="text-foreground/80">
          {dpText.compareLine(
            <PageLink to={{ kind: "dpProblem", algorithm: other }} onNavigate={onNavigate}>
              {dpProblems[other].title}
            </PageLink>,
            (children) => (
              <PageLink to={{ kind: "dpRace" }} onNavigate={onNavigate}>
                {children}
              </PageLink>
            ),
          )}
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
