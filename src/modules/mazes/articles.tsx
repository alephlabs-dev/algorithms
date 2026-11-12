import { Explanation, Section } from "@/components/Article";
import { articleText } from "@/components/articleText";
import { PageLink } from "@/components/PageLink";
import { localized } from "@/i18n";
import type { Nav } from "@/modules/types";
import { mazeAlgorithms, raceDescription } from "./algorithms";
import { mazePseudocode } from "@/utils/mazeGenerators";
import { MAZE_ALGORITHMS, type MazeAlgorithm } from "./types";

const mazesText = localized({
  en: {
    moduleTitle: "Maze generation",
    moduleIntro:
      "A maze can be carved from a grid of walled-in cells by knocking down one wall at a time. Watch every decision, every backtrack and every dead-end cell as a perfect maze takes shape.",
    all: "Algorithms",
    why: "What makes a maze perfect?",
    whyText:
      "A perfect maze has exactly one route between any two cells: no loops, and no part closed off from the rest. Think of each cell as a point and each knocked-down wall as a link between two points: a perfect maze is then a spanning tree of the grid, which joins n cells with exactly n − 1 links. Any way of building a random spanning tree carves a perfect maze, and that's why maze generators look so much like graph algorithms: a stack, a frontier, disjoint sets or a random walk. Each one leaves its own texture. Count the dead-end cells, the ones with only one way out, and you can tell them apart.",
    facts: "In short",
    sideBySide: "Side by side",
    startRace: "Carve them side by side",
    raceTitle: "Maze generators side by side",
    raceIntro: "Two to four maze generators carve the same seed, from the same start cell, at the same pace.",
    raceTip:
      "Depth-first search runs down long corridors before it backtracks, so its maze has few dead-end cells. Prim grows outward from everywhere on its frontier at once, which leaves many short branches. Kruskal and Wilson land in between. Wilson gives every possible maze the same chance, so its texture is the typical one.",
    learnEach: "Learn each generator",
  },
  es: {
    moduleTitle: "Generación de laberintos",
    moduleIntro:
      "Un laberinto se puede excavar en una cuadrícula de celdas amuralladas derribando una pared a la vez. Mira cada decisión, cada retroceso y cada celda sin salida mientras toma forma un laberinto perfecto.",
    all: "Algoritmos",
    why: "¿Qué hace perfecto a un laberinto?",
    whyText:
      "Un laberinto perfecto tiene un único camino entre dos celdas cualesquiera: sin ciclos y sin partes aisladas del resto. Si cada celda es un punto y cada pared derribada une dos puntos, un laberinto perfecto es un árbol generador de la cuadrícula, que une n celdas con exactamente n − 1 uniones. Cualquier forma de construir un árbol generador al azar excava un laberinto perfecto, y por eso los generadores de laberintos se parecen tanto a los algoritmos de grafos: una pila, una frontera, conjuntos disjuntos o un paseo aleatorio. Cada uno deja su propia textura. Cuenta las celdas sin salida, las que tienen una sola salida, y podrás distinguirlos.",
    facts: "En resumen",
    sideBySide: "Lado a lado",
    startRace: "Excávalos lado a lado",
    raceTitle: "Generadores de laberintos lado a lado",
    raceIntro: "De dos a cuatro generadores de laberintos excavan la misma semilla, desde la misma celda de inicio, al mismo ritmo.",
    raceTip:
      "La búsqueda en profundidad recorre pasillos largos antes de retroceder, así que su laberinto tiene pocas celdas sin salida. Prim crece hacia afuera desde toda su frontera a la vez, lo que deja muchas ramas cortas. Kruskal y Wilson quedan en el medio. Wilson le da a cada laberinto posible la misma probabilidad, así que su textura es la típica.",
    learnEach: "Aprende cada generador",
  },
});

export const MazesArticle = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{mazesText.moduleTitle}</h1>
      <p className="text-lg text-foreground/80">{mazesText.moduleIntro}</p>
    </header>
    <Section title={mazesText.all}>
      <ul className="tap-rows flex flex-col divide-y divide-edge">
        {MAZE_ALGORITHMS.map((algorithm) => (
          <li key={algorithm} className="flex flex-col gap-1 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <PageLink to={{ module: "mazes", page: "algorithm", algorithm }} onNavigate={onNavigate}>
                {mazeAlgorithms[algorithm].title}
              </PageLink>
              <span className="font-mono text-xs text-foreground/60">{mazeAlgorithms[algorithm].texture}</span>
            </div>
            <p className="text-sm text-foreground/75">{mazeAlgorithms[algorithm].shortDescription}</p>
          </li>
        ))}
      </ul>
    </Section>
    <Explanation title={mazesText.why}>
      <p className="leading-relaxed text-foreground/80">{mazesText.whyText}</p>
    </Explanation>
    <Section title={mazesText.sideBySide}>
      <p className="leading-relaxed text-foreground/80">
        {raceDescription}{" "}
        <PageLink to={{ module: "mazes", page: "race" }} onNavigate={onNavigate}>
          {mazesText.startRace}
        </PageLink>
        .
      </p>
    </Section>
  </>
);

/** The maze generators, linking to their pages. */
const MazeIndex = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <ul className="tap-rows flex flex-wrap gap-x-6 gap-y-2">
    {MAZE_ALGORITHMS.map((algorithm) => (
      <li key={algorithm}>
        <PageLink to={{ module: "mazes", page: "algorithm", algorithm }} onNavigate={onNavigate}>
          {mazeAlgorithms[algorithm].title}
        </PageLink>
      </li>
    ))}
  </ul>
);

export const MazesRaceArticle = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{mazesText.raceTitle}</h1>
      <p className="text-lg text-foreground/80">{mazesText.raceIntro}</p>
    </header>
    <Explanation title={articleText.howRaceWorks}>
      <p className="leading-relaxed text-foreground/80">{raceDescription}</p>
      <p className="leading-relaxed text-foreground/80">{mazesText.raceTip}</p>
    </Explanation>
    <Section title={mazesText.learnEach}>
      <MazeIndex onNavigate={onNavigate} />
    </Section>
  </>
);

export const MazeArticle = ({ algorithm }: { algorithm: MazeAlgorithm }) => {
  const { title, named, shortDescription, longDescription, structure, texture, timeComplexity } = mazeAlgorithms[algorithm];
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Explanation title={articleText.howItWorks(named)}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Explanation>
      <Explanation title={articleText.pseudocode}>
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {mazePseudocode[algorithm].join("\n")}
        </pre>
      </Explanation>
      <Section title={mazesText.facts}>
        <p className="font-mono text-sm text-foreground/75">{[structure, texture, timeComplexity].join(" · ")}</p>
      </Section>
    </>
  );
};

