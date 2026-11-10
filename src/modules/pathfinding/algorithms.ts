import { localized } from "@/i18n";
import type { PathAlgorithm } from "./types";

type PathAlgorithmText = {
  title: string;
  /** How the name reads mid-sentence ("How … works"), when that differs from the title. */
  named?: string;
  /** Short name for tight spots (pickers on phones). */
  short: string;
  shortDescription: string;
  longDescription: string;
  /** What it keeps the cells to explore in. */
  structure: string;
};

type PathAlgorithmData = {
  /** Guarantees the shortest path: by steps, by cost, or not at all. */
  shortest: "steps" | "cost" | "no";
  /** Takes mud (cell costs) into account. */
  weighted: boolean;
  timeComplexity: string;
};

type PathAlgorithmDetails = PathAlgorithmText & PathAlgorithmData & { named: string };

// Key order is the order shown in the UI.
const data: Record<PathAlgorithm, PathAlgorithmData> = {
  bfs: { shortest: "steps", weighted: false, timeComplexity: "O(V + E)" },
  dfs: { shortest: "no", weighted: false, timeComplexity: "O(V + E)" },
  dijkstra: { shortest: "cost", weighted: true, timeComplexity: "O((V + E) log V)" },
  astar: { shortest: "cost", weighted: true, timeComplexity: "O((V + E) log V) worst case" },
  greedy: { shortest: "no", weighted: false, timeComplexity: "O((V + E) log V) worst case" },
};

const text = localized<Record<PathAlgorithm, PathAlgorithmText> & { worstCase: string }>({
  en: {
    worstCase: "worst case",
    bfs: {
      title: "Breadth-First Search",
      short: "BFS",
      shortDescription:
        "Explores in rings around the start, so the first path it finds has the fewest steps. Ignores how costly each cell is.",
      longDescription:
        "Breadth-First Search (BFS) keeps the cells to explore in a queue: first in, first out. It looks at every cell one step away from the start, then every cell two steps away, and so on, so the search spreads in rings. The first time it reaches the target, no shorter path (in number of steps) can exist. It treats every step the same, so it walks straight through mud that a cost-aware search would go around. It runs in O(V + E) time, where V is the number of cells and E the connections between them.",
      structure: "Queue (first in, first out)",
    },
    dfs: {
      title: "Depth-First Search",
      short: "DFS",
      shortDescription:
        "Follows one corridor as far as it goes before backtracking. Always finds a way if there is one, but rarely the shortest.",
      longDescription:
        "Depth-First Search (DFS) keeps the cells to explore in a stack: last in, first out. It takes the newest cell each time, so it dives down one direction until it hits a dead end, then backtracks to the last branch and tries the next. It's simple and uses little memory, and it's how the maze generator here carves its corridors, but the path it finds depends on the order it tries directions, and is often long and winding. It runs in O(V + E) time.",
      structure: "Stack (last in, first out)",
    },
    dijkstra: {
      title: "Dijkstra's Algorithm",
      short: "Dijkstra",
      shortDescription:
        "Always expands the cheapest cell reached so far, so it finds the lowest-cost path, going around mud when that's cheaper.",
      longDescription:
        "Dijkstra's algorithm tracks the cheapest known cost to reach each cell and always expands the open cell with the lowest one. When it takes a cell out, no cheaper way to reach it can appear later, so when the target comes out, its path is the cheapest possible. With every step costing the same it behaves like BFS; with mud it bends around expensive cells when the detour is cheaper. It explores in every direction equally, which is thorough but wasteful when the target is far to one side. With a priority queue it runs in O((V + E) log V).",
      structure: "Priority queue, by cost so far",
    },
    astar: {
      title: "A* Search",
      short: "A*",
      shortDescription:
        "Dijkstra with a sense of direction: ranks cells by cost so far plus distance left, so it heads for the target and still finds the cheapest path.",
      longDescription:
        "A* (pronounced “A star”) ranks each open cell by the cost to reach it plus an estimate of the cost left to the target. Here that estimate is the Manhattan distance, the steps left ignoring walls, which never overestimates. That's enough to guarantee the cheapest path while skipping most of the cells Dijkstra would look at behind the start. It's the standard choice for games and maps. Its running time depends on how good the estimate is; in the worst case it matches Dijkstra.",
      structure: "Priority queue, by cost so far + distance left",
    },
    greedy: {
      title: "Greedy Best-First Search",
      short: "Greedy",
      shortDescription:
        "Always moves towards whichever cell looks closest to the target. Fast on open ground, easily fooled by walls and mud.",
      longDescription:
        "Greedy Best-First Search ranks open cells only by how far they look from the target, ignoring what it cost to get there. On open ground it runs almost straight at the target and looks at very few cells. But it has no memory of cost: it walks into dead ends that point the right way, wades through mud, and the path it returns can be far from the shortest. It's a useful contrast to A*, which adds the cost so far to the same estimate.",
      structure: "Priority queue, by distance left",
    },
  },
  es: {
    worstCase: "en el peor caso",
    bfs: {
      title: "Búsqueda en anchura",
      named: "la búsqueda en anchura",
      short: "BFS",
      shortDescription:
        "Explora en anillos alrededor del inicio, así que el primer camino que encuentra es el de menos pasos. No tiene en cuenta cuánto cuesta cada celda.",
      longDescription:
        "La búsqueda en anchura (BFS) guarda las celdas por explorar en una cola: la primera que entra es la primera que sale. Revisa todas las celdas a un paso del inicio, después todas las que están a dos pasos, y así sigue, de modo que la búsqueda se expande en anillos. La primera vez que llega al destino, no puede existir un camino más corto (en cantidad de pasos). Trata todos los pasos igual, así que atraviesa el barro que una búsqueda atenta al costo rodearía. Tarda O(V + E), donde V es la cantidad de celdas y E las conexiones entre ellas.",
      structure: "Cola (la primera que entra, sale primero)",
    },
    dfs: {
      title: "Búsqueda en profundidad",
      named: "la búsqueda en profundidad",
      short: "DFS",
      shortDescription:
        "Sigue un pasillo hasta el final antes de retroceder. Siempre encuentra un camino si existe, pero casi nunca el más corto.",
      longDescription:
        "La búsqueda en profundidad (DFS) guarda las celdas por explorar en una pila: la última que entra es la primera que sale. Siempre toma la celda más nueva, así que avanza en una dirección hasta chocar con un callejón sin salida, retrocede a la última bifurcación y prueba la siguiente. Es simple y usa poca memoria, y es como el generador de laberintos de aquí excava sus pasillos, pero el camino que encuentra depende del orden en que prueba las direcciones y suele ser largo y sinuoso. Tarda O(V + E).",
      structure: "Pila (la última que entra, sale primero)",
    },
    dijkstra: {
      title: "Algoritmo de Dijkstra",
      named: "el algoritmo de Dijkstra",
      short: "Dijkstra",
      shortDescription:
        "Siempre expande la celda más barata alcanzada hasta ahora, así que encuentra el camino de menor costo y rodea el barro cuando eso sale más barato.",
      longDescription:
        "El algoritmo de Dijkstra lleva la cuenta del costo más barato conocido para llegar a cada celda y siempre expande la celda abierta con el menor. Cuando saca una celda, ya no puede aparecer una forma más barata de llegar a ella, así que cuando sale el destino, su camino es el más barato posible. Si todos los pasos cuestan lo mismo se comporta como BFS; con barro, rodea las celdas caras cuando el desvío sale más barato. Explora en todas las direcciones por igual, algo minucioso pero derrochador cuando el destino está muy hacia un lado. Con una cola de prioridad tarda O((V + E) log V).",
      structure: "Cola de prioridad, por costo acumulado",
    },
    astar: {
      title: "Búsqueda A*",
      named: "la búsqueda A*",
      short: "A*",
      shortDescription:
        "Dijkstra con sentido de la orientación: ordena las celdas por costo acumulado más distancia restante, así que va hacia el destino y aun así encuentra el camino más barato.",
      longDescription:
        "A* (se pronuncia “A estrella”) ordena cada celda abierta por el costo de llegar a ella más una estimación del costo que falta hasta el destino. Aquí esa estimación es la distancia Manhattan, los pasos que faltan sin contar las paredes, que nunca sobreestima. Eso basta para garantizar el camino más barato y saltarse la mayoría de las celdas que Dijkstra revisaría detrás del inicio. Es la opción habitual en videojuegos y mapas. Su tiempo depende de qué tan buena sea la estimación; en el peor caso iguala a Dijkstra.",
      structure: "Cola de prioridad, por costo acumulado + distancia restante",
    },
    greedy: {
      title: "Búsqueda voraz primero el mejor",
      named: "la búsqueda voraz primero el mejor",
      short: "Voraz",
      shortDescription:
        "Siempre avanza hacia la celda que parece más cercana al destino. Rápida en terreno abierto, pero las paredes y el barro la engañan fácilmente.",
      longDescription:
        "La búsqueda voraz primero el mejor ordena las celdas abiertas solo por lo lejos que parecen estar del destino, sin importar cuánto costó llegar a ellas. En terreno abierto corre casi en línea recta hacia el destino y revisa muy pocas celdas. Pero no recuerda el costo: se mete en callejones sin salida que apuntan en la dirección correcta, atraviesa el barro, y el camino que devuelve puede estar lejos del más corto. Es un buen contraste con A*, que suma el costo acumulado a la misma estimación.",
      structure: "Cola de prioridad, por distancia restante",
    },
  },
});

export const pathAlgorithms = Object.fromEntries(
  (Object.keys(data) as PathAlgorithm[]).map((id) => [
    id,
    {
      ...text[id],
      ...data[id],
      named: text[id].named ?? text[id].title,
      timeComplexity: data[id].timeComplexity.replace("worst case", text.worstCase),
    },
  ])
) as Record<PathAlgorithm, PathAlgorithmDetails>;

const traits = localized({
  en: {
    cheapest: "Cheapest path",
    fewest: "Fewest steps",
    any: "Any path",
    counts: "counts mud",
    ignores: "ignores mud",
  },
  // Short: it sits beside the module and algorithm pills on desktop.
  es: {
    cheapest: "Más barato",
    fewest: "Menos pasos",
    any: "Algún camino",
    counts: "usa el barro",
    ignores: "ignora el barro",
  },
});

/** Shortest-path guarantee and cost handling, in a few words. */
export const pathTraits = (algorithm: PathAlgorithm) => {
  const { shortest, weighted } = pathAlgorithms[algorithm];
  const guarantee = shortest === "cost" ? traits.cheapest : shortest === "steps" ? traits.fewest : traits.any;
  return `${guarantee} · ${weighted ? traits.counts : traits.ignores}`;
};
