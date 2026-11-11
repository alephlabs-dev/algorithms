import { Explanation, type Link, Section } from "@/components/Article";
import { articleText } from "@/components/articleText";
import { PageLink } from "@/components/PageLink";
import { localized } from "@/i18n";
import type { Nav } from "@/modules/types";
import { raceDescription, structures } from "./algorithms";
import { structurePseudocode } from "./pseudocode";
import type { StructureAlgorithm } from "./types";

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

const structureOrder = Object.keys(structures) as StructureAlgorithm[];

const StructureIndex = ({ current, onNavigate }: { current?: StructureAlgorithm; onNavigate?: Nav["onNavigate"] }) => (
  <ul className="tap-rows flex flex-wrap gap-x-6 gap-y-2">
    {structureOrder.map((algorithm) => (
      <li key={algorithm}>
        {algorithm === current ? (
          <span className="font-semibold">{structures[algorithm].title}</span>
        ) : (
          <PageLink to={{ module: "structures", page: "algorithm", algorithm }} onNavigate={onNavigate}>
            {structures[algorithm].title}
          </PageLink>
        )}
      </li>
    ))}
  </ul>
);

export const StructuresArticle = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{structureText.moduleTitle}</h1>
      <p className="text-lg text-foreground/80">{structureText.moduleIntro}</p>
    </header>
    {(["Trees", "Heaps", "Hash tables"] as const).map((group) => (
      <Section key={group} title={structureText.groups[group]}>
        <ul className="tap-rows flex flex-col divide-y divide-edge">
          {structureOrder
            .filter((algorithm) => structures[algorithm].group === group)
            .map((algorithm) => (
              <li key={algorithm} className="flex flex-col gap-1 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <PageLink to={{ module: "structures", page: "algorithm", algorithm }} onNavigate={onNavigate}>
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
        {raceDescription}{" "}
        <PageLink to={{ module: "structures", page: "race" }} onNavigate={onNavigate}>
          {articleText.startRace}
        </PageLink>
        .
      </p>
    </Section>
  </>
);

export const StructureArticle = ({ algorithm, onNavigate }: { algorithm: StructureAlgorithm; onNavigate?: Nav["onNavigate"] }) => {
  const { title, named, shortDescription, longDescription, cost, shape, shapeLabel } = structures[algorithm];
  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-display font-semibold">{title}</h1>
        <p className="text-lg text-foreground/80">{shortDescription}</p>
      </header>
      <Explanation title={structureText.howItWorks(named)}>
        <p className="leading-relaxed text-foreground/80">{longDescription}</p>
      </Explanation>
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
      <Explanation title={articleText.pseudocode}>
        <pre className="overflow-x-auto rounded-2xl border border-edge bg-surface p-5 font-mono text-[13px] leading-6">
          {structurePseudocode[algorithm].join("\n")}
        </pre>
      </Explanation>
      <Section title={structureText.compare}>
        <StructureIndex current={algorithm} onNavigate={onNavigate} />
        <p className="text-foreground/80">
          {structureText.orRace((children) => (
            <PageLink to={{ module: "structures", page: "race" }} onNavigate={onNavigate}>
              {children}
            </PageLink>
          ))}
        </p>
      </Section>
    </>
  );
};

export const StructureRaceArticle = ({ onNavigate }: { onNavigate?: Nav["onNavigate"] }) => (
  <>
    <header className="flex flex-col gap-3">
      <h1 className="text-display font-semibold">{structureText.raceTitle}</h1>
      <p className="text-lg text-foreground/80">{structureText.raceIntro}</p>
    </header>
    <Explanation title={structureText.whyBalancing}>
      <p className="leading-relaxed text-foreground/80">{raceDescription}</p>
      <p className="leading-relaxed text-foreground/80">{structureText.raceTip}</p>
    </Explanation>
    <Section title={structureText.learnEach}>
      <StructureIndex onNavigate={onNavigate} />
    </Section>
  </>
);

