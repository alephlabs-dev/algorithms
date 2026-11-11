import { Explanation, Section } from "@/components/Article";
import { articleText } from "@/components/articleText";
import { PageLink } from "@/components/PageLink";
import { localized } from "@/i18n";
import type { Nav } from "@/modules/types";
import { backtrackingProblems } from "./algorithms";
import { queensPseudocode, sudokuPseudocode } from "./pseudocode";
import type { BacktrackingProblem } from "./types";

const backtrackingText = localized({
  en: {
    moduleTitle: "Backtracking",
    moduleIntro:
      "Some puzzles are solved by making one choice at a time and taking the last one back as soon as it can't work. Watch every choice, every conflict and every dead end as backtracking places queens on a chessboard and fills in a Sudoku.",
    all: "Problems",
    why: "Why take choices back?",
    whyText:
      "Trying every complete arrangement of a puzzle is hopeless: eight queens alone can sit on a board in over sixteen million ways, one per row. Backtracking builds an arrangement piece by piece instead, and checks each piece the moment it's placed. A piece that breaks a rule is skipped on the spot, so every arrangement that would have started with it is never looked at. When no piece fits, the last one is taken back and its next option is tried. It's how Sudoku solvers, crossword fillers, timetable planners and parsers work.",
    facts: "In short",
  },
  es: {
    moduleTitle: "Backtracking",
    moduleIntro:
      "Algunos problemas se resuelven haciendo una elección a la vez y deshaciendo la última en cuanto deja de servir. Mira cada elección, cada conflicto y cada callejón sin salida mientras el backtracking coloca reinas en un tablero de ajedrez y llena un sudoku.",
    all: "Problemas",
    why: "¿Por qué deshacer elecciones?",
    whyText:
      "Probar todas las disposiciones completas de un problema no tiene esperanza: solo ocho reinas, una por fila, se pueden colocar de más de dieciséis millones de formas. El backtracking construye una disposición pieza a pieza y comprueba cada pieza en cuanto la coloca. Una pieza que rompe una regla se salta en el acto, así que nunca se mira ninguna disposición que hubiera empezado con ella. Cuando no cabe ninguna pieza, se quita la última y se prueba su siguiente opción. Así funcionan los programas que resuelven sudokus, llenan crucigramas, arman horarios o analizan código.",
    facts: "En resumen",
  },
});

const problemOrder = Object.keys(backtrackingProblems) as BacktrackingProblem[];

export const BacktrackingArticle = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{backtrackingText.moduleTitle}</h1>
      <p className="text-lg text-foreground/80">{backtrackingText.moduleIntro}</p>
    </header>
    <Section title={backtrackingText.all}>
      <ul className="tap-rows flex flex-col divide-y divide-edge">
        {problemOrder.map((algorithm) => (
          <li key={algorithm} className="flex flex-col gap-1 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <PageLink to={{ module: "backtracking", page: "algorithm", algorithm }} onNavigate={onNavigate}>
                {backtrackingProblems[algorithm].title}
              </PageLink>
              <span className="font-mono text-xs text-foreground/60">{backtrackingProblems[algorithm].cost}</span>
            </div>
            <p className="text-sm text-foreground/75">{backtrackingProblems[algorithm].shortDescription}</p>
          </li>
        ))}
      </ul>
    </Section>
    <Explanation title={backtrackingText.why}>
      <p className="leading-relaxed text-foreground/80">{backtrackingText.whyText}</p>
    </Explanation>
  </>
);

export const BacktrackingProblemArticle = ({ algorithm }: { algorithm: BacktrackingProblem }) => {
  const { title, howItWorks, shortDescription, longDescription, cost } = backtrackingProblems[algorithm];
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Explanation title={howItWorks}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Explanation>
      <Explanation title={articleText.pseudocode}>
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {(algorithm === "sudoku" ? sudokuPseudocode : queensPseudocode).join("\n")}
        </pre>
      </Explanation>
      <Section title={backtrackingText.facts}>
        <p className="font-mono text-sm text-foreground/75">{cost}</p>
      </Section>
    </>
  );
};

