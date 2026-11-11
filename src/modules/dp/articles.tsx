import type { ReactNode } from "react";
import { Explanation, type Link, Section } from "@/components/Article";
import { articleText } from "@/components/articleText";
import { PageLink } from "@/components/PageLink";
import { localized } from "@/i18n";
import type { Nav } from "@/modules/types";
import { dpProblems, raceDescription } from "./algorithms";
import { dpPseudocode } from "./pseudocode";
import type { DpAlgorithm } from "./types";

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

const dpOrder = Object.keys(dpProblems) as DpAlgorithm[];

export const DpArticle = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{dpText.moduleTitle}</h1>
      <p className="text-lg text-foreground/80">{dpText.moduleIntro}</p>
    </header>
    <Section title={dpText.problems}>
      <ul className="tap-rows flex flex-col divide-y divide-edge">
        {dpOrder.map((algorithm) => (
          <li key={algorithm} className="flex flex-col gap-1 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <PageLink to={{ module: "dp", page: "algorithm", algorithm }} onNavigate={onNavigate}>
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
        {raceDescription}{" "}
        <PageLink to={{ module: "dp", page: "race" }} onNavigate={onNavigate}>
          {articleText.startRace}
        </PageLink>
        .
      </p>
    </Section>
    <Explanation title={dpText.whyTable}>
      <p className="leading-relaxed text-foreground/80">{dpText.whyTableText}</p>
    </Explanation>
  </>
);

export const DpRaceArticle = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{dpText.raceTitle}</h1>
      <p className="text-lg text-foreground/80">{dpText.raceIntro}</p>
    </header>
    <Explanation title={dpText.whatMemoSaves}>
      <p className="leading-relaxed text-foreground/80">{raceDescription}</p>
      <p className="leading-relaxed text-foreground/80">{dpText.raceTip}</p>
    </Explanation>
    <Section title={dpText.theProblems}>
      <ul className="tap-rows flex flex-wrap gap-x-6 gap-y-2">
        {dpOrder.map((algorithm) => (
          <li key={algorithm}>
            <PageLink to={{ module: "dp", page: "algorithm", algorithm }} onNavigate={onNavigate}>
              {dpProblems[algorithm].title}
            </PageLink>
          </li>
        ))}
      </ul>
    </Section>
  </>
);

export const DpProblemArticle = ({ algorithm, onNavigate }: { algorithm: DpAlgorithm; onNavigate?: Nav["onNavigate"] }) => {
  const { title, shortDescription, longDescription, cost, cell } = dpProblems[algorithm];
  const other = algorithm === "edit" ? "lcs" : "edit";
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Explanation title={dpText.howItWorks}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Explanation>
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
      <Explanation title={articleText.pseudocode}>
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {dpPseudocode[algorithm].join("\n")}
        </pre>
      </Explanation>
      <Section title={dpText.compare}>
        <p className="text-foreground/80">
          {dpText.compareLine(
            <PageLink to={{ module: "dp", page: "algorithm", algorithm: other }} onNavigate={onNavigate}>
              {dpProblems[other].title}
            </PageLink>,
            (children) => (
              <PageLink to={{ module: "dp", page: "race" }} onNavigate={onNavigate}>
                {children}
              </PageLink>
            ),
          )}
        </p>
      </Section>
    </>
  );
};

