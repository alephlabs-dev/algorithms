import { localized } from "@/i18n";
import { MAZE_ALGORITHMS } from "./generators";
import type { MazeAlgorithm } from "./types";
import type { GridSize } from "@/utils/gridSize";

type MazeAlgorithmText = {
  /** The full name, for the about text and the page title. */
  title: string;
  /** How the name reads mid-sentence ("How … works"), when that differs from the title. */
  named?: string;
  /** The segment label. */
  short: string;
  shortDescription: string;
  longDescription: string;
  /** What it keeps track of, in a few words. */
  structure: string;
  /** The texture it leaves, in a few words. */
  texture: string;
};

type MazeAlgorithmDetails = MazeAlgorithmText & { named: string; timeComplexity: string };

// Wilson: the expected length of its walks on a grid, which is random.
const timeComplexity: Record<MazeAlgorithm, string> = {
  dfs: "O(n)",
  prim: "O(n)",
  kruskal: "O(n α(n))",
  wilson: "O(n log n)",
};

const text = localized<Record<MazeAlgorithm, MazeAlgorithmText>>({
  en: {
    dfs: {
      title: "Randomized Depth-First Search",
      short: "DFS",
      shortDescription:
        "Carves on from the newest cell in a random direction until it's stuck, then backtracks along its stack. Long winding corridors, few dead-end cells.",
      longDescription:
        "Randomized depth-first search, also called the recursive backtracker, starts from a random cell and keeps a stack of the cells it has carved through. Each step it looks at the cell on top of the stack: if that cell has neighbours that aren't carved yet, it picks one at random, knocks down the wall between them and pushes the new cell. If not, it pops the cell and backtracks to the one before. When the stack is empty, every cell has been carved exactly once through exactly one wall, so the maze is perfect: one route between any two cells. Because it always pushes on from the newest cell, it makes long winding corridors with few branches and few dead-end cells, the easiest texture to spot. It takes 2n steps for n cells (every cell is carved once and popped once), so O(n) time, and its stack can hold every cell, so O(n) space.",
      structure: "Stack (last in, first out)",
      texture: "Long corridors, few dead-end cells",
    },
    prim: {
      title: "Randomized Prim's Algorithm",
      named: "randomized Prim's algorithm",
      short: "Prim",
      shortDescription:
        "Grows the maze from its frontier, the uncarved cells next to it: each step picks one at random and joins it through a wall. Short branches, many dead-end cells.",
      longDescription:
        "Randomized Prim's algorithm is Prim's minimum spanning tree algorithm with random choices in place of weights. It carves a random start cell and puts its neighbours on the frontier: the cells that aren't carved yet but touch the maze. Each step it picks a frontier cell at random, knocks down the wall between it and one of its carved neighbours (picked at random too if there are several), and adds that cell's uncarved neighbours to the frontier. When the frontier is empty, every cell has joined the maze through exactly one wall, so the maze is perfect. Because the pick can land anywhere along the edge of the maze, it grows outward from the start in every direction at once, like a stain, and leaves short branching passages with many dead-end cells. It takes one step per cell, n steps for n cells. Picking from the frontier by swapping with its last cell costs O(1), so it runs in O(n) time, and the frontier can hold O(n) cells.",
      structure: "Frontier (a random pick)",
      texture: "Short branches, many dead-end cells",
    },
    kruskal: {
      title: "Randomized Kruskal's Algorithm",
      named: "randomized Kruskal's algorithm",
      short: "Kruskal",
      shortDescription:
        "Starts with every cell as its own region and tests the walls in a random order: a wall between two regions is carved and they merge, a wall inside one is skipped. Many dead-end cells, all over at once.",
      longDescription:
        "Randomized Kruskal's algorithm is Kruskal's minimum spanning tree algorithm with the walls shuffled in place of sorting them by weight. It starts with every cell carved but walled off, each one a region of its own, and goes through the walls between cells in that random order. If the two cells on either side of a wall are in different regions, it carves the wall and the two regions merge into one. If they're already in the same region, there's a route between them, so carving the wall would close a loop: it skips the wall. Once every cell is in one region, there's exactly one route between any two cells, so the maze is perfect, and it stops without testing the walls left over, since every one of them would be skipped. Because the walls come in random order, the maze grows in little patches all over the grid that link up as they meet, with no start and no direction, and leaves many dead-end cells. It carves n − 1 walls for n cells, and tests up to the roughly 2n walls there are. The regions are kept in a union-find structure, which answers “same region?” and merges two regions in nearly constant time: O(n α(n)) in all, where α grows so slowly it stays under 5 for any maze that fits on a screen. The regions need O(n) space.",
      structure: "Union-find (disjoint sets)",
      texture: "Many dead-end cells, no direction",
    },
    wilson: {
      title: "Wilson's Algorithm",
      named: "Wilson's algorithm",
      short: "Wilson",
      shortDescription:
        "Walks at random from a cell outside the maze until it reaches the maze, erasing every loop on the way, then carves the whole walk in. Slow at first, fast at the end; no bias.",
      longDescription:
        "Wilson's algorithm builds the maze out of loop-erased random walks. It puts one random cell in the maze. Then, from a random cell outside the maze, it walks at random, one neighbour at a time, until it steps into the maze. Whenever the walk steps onto a cell it has already passed, it has made a loop, and the loop is erased: the walk goes back to how it was when it first reached that cell. When the walk reaches the maze it has no loops, so all of it is carved in at once, a new branch joined through one wall. This repeats until every cell is in the maze. The first walk is slow, because it wanders looking for a maze of one cell; every walk after that has a bigger maze to find, so they get shorter and shorter. Unlike depth-first search and Prim, it has no bias: every perfect maze of the grid is equally likely, so its texture sits between theirs. The walks are random, so its time is too: on a grid they take O(n log n) steps on average for n cells, and the walk can hold O(n) cells.",
      structure: "A random walk (loops erased)",
      texture: "No bias: every perfect maze equally likely",
    },
  },
  es: {
    dfs: {
      title: "Búsqueda en profundidad aleatoria",
      named: "la búsqueda en profundidad aleatoria",
      short: "DFS",
      shortDescription:
        "Excava desde la celda más nueva en una dirección al azar hasta quedar atrapada, y entonces retrocede por su pila. Pasillos largos y sinuosos, pocas celdas sin salida.",
      longDescription:
        "La búsqueda en profundidad aleatoria, también llamada backtracker recursivo, empieza en una celda al azar y guarda en una pila las celdas por las que va excavando. En cada paso mira la celda de arriba de la pila: si tiene vecinas sin excavar, elige una al azar, derriba la pared entre ellas y apila la nueva. Si no, desapila la celda y retrocede a la anterior. Cuando la pila queda vacía, cada celda se excavó una sola vez a través de una sola pared, así que el laberinto es perfecto: un único camino entre dos celdas cualesquiera. Como siempre sigue desde la celda más nueva, hace pasillos largos y sinuosos con pocas ramas y pocas celdas sin salida, la textura más fácil de reconocer. Tarda 2n pasos para n celdas (cada celda se excava una vez y se desapila una vez), o sea O(n), y su pila puede llegar a guardar todas las celdas, así que usa O(n) de memoria.",
      structure: "Pila (la última que entra, sale primero)",
      texture: "Pasillos largos, pocas celdas sin salida",
    },
    prim: {
      title: "Algoritmo de Prim aleatorio",
      named: "el algoritmo de Prim aleatorio",
      short: "Prim",
      shortDescription:
        "Hace crecer el laberinto desde su frontera, las celdas sin excavar que lo tocan: en cada paso elige una al azar y la une por una pared. Ramas cortas, muchas celdas sin salida.",
      longDescription:
        "El algoritmo de Prim aleatorio es el algoritmo de Prim para el árbol generador mínimo con decisiones al azar en lugar de pesos. Excava una celda inicial al azar y pone sus vecinas en la frontera: las celdas que aún no están excavadas pero tocan el laberinto. En cada paso elige una celda de la frontera al azar, derriba la pared entre ella y una de sus vecinas excavadas (también al azar si hay varias) y agrega a la frontera las vecinas sin excavar de esa celda. Cuando la frontera queda vacía, cada celda se unió al laberinto por una sola pared, así que el laberinto es perfecto. Como la elección puede caer en cualquier punto del borde del laberinto, crece desde el inicio en todas direcciones a la vez, como una mancha, y deja pasillos cortos y ramificados con muchas celdas sin salida. Da un paso por celda, n pasos para n celdas. Sacar una celda de la frontera intercambiándola con la última cuesta O(1), así que tarda O(n), y la frontera puede llegar a guardar O(n) celdas.",
      structure: "Frontera (una elección al azar)",
      texture: "Ramas cortas, muchas celdas sin salida",
    },
    kruskal: {
      title: "Algoritmo de Kruskal aleatorio",
      named: "el algoritmo de Kruskal aleatorio",
      short: "Kruskal",
      shortDescription:
        "Empieza con cada celda como una región propia y prueba las paredes en orden aleatorio: una pared entre dos regiones se excava y las une, una pared dentro de una se omite. Muchas celdas sin salida, por todas partes a la vez.",
      longDescription:
        "El algoritmo de Kruskal aleatorio es el algoritmo de Kruskal para el árbol generador mínimo con las paredes mezcladas en lugar de ordenadas por peso. Empieza con todas las celdas excavadas pero aisladas, cada una en su propia región. Luego recorre las paredes entre celdas en ese orden al azar. Si las dos celdas a los lados de una pared están en regiones distintas, excava la pared y las dos regiones se unen en una. Si ya están en la misma región, ya hay un camino entre ellas, así que excavar la pared cerraría un ciclo: la omite. Cuando todas las celdas están en una sola región, hay exactamente un camino entre dos celdas cualesquiera, así que el laberinto es perfecto, y se detiene sin probar las paredes que quedan, porque todas se omitirían. Como las paredes llegan en orden aleatorio, el laberinto crece en pequeños parches por toda la cuadrícula que se unen al encontrarse, sin inicio ni dirección, y deja muchas celdas sin salida. Excava n − 1 paredes para n celdas y prueba como mucho las cerca de 2n paredes que hay. Las regiones se guardan en una estructura union-find, que responde «¿misma región?» y une dos regiones en tiempo casi constante: O(n α(n)) en total, donde α crece tan despacio que no llega a 5 en ningún laberinto que entre en una pantalla. Las regiones ocupan O(n) de espacio.",
      structure: "Union-find (conjuntos disjuntos)",
      texture: "Muchas celdas sin salida, sin dirección",
    },
    wilson: {
      title: "Algoritmo de Wilson",
      named: "el algoritmo de Wilson",
      short: "Wilson",
      shortDescription:
        "Camina al azar desde una celda fuera del laberinto hasta llegar a él, borrando cada ciclo en el camino, y entonces excava toda la caminata. Lento al principio, rápido al final; sin sesgo.",
      longDescription:
        "El algoritmo de Wilson arma el laberinto con caminatas aleatorias sin ciclos. Pone una celda al azar en el laberinto. Después, desde una celda al azar fuera del laberinto, camina al azar, de vecina en vecina, hasta pisar el laberinto. Cada vez que la caminata pisa una celda por la que ya pasó, forma un ciclo, y el ciclo se borra: la caminata vuelve a como estaba cuando llegó a esa celda por primera vez. Cuando la caminata llega al laberinto no tiene ciclos, así que se excava entera de una vez, una rama nueva unida por una sola pared. Esto se repite hasta que todas las celdas están en el laberinto. La primera caminata es lenta, porque deambula buscando un laberinto de una sola celda; cada caminata siguiente tiene un laberinto más grande que encontrar, así que son cada vez más cortas. A diferencia de la búsqueda en profundidad y de Prim, no tiene sesgo: todos los laberintos perfectos de la cuadrícula son igual de probables, así que su textura queda entre las de ellos. Las caminatas son al azar, y su tiempo también: en una cuadrícula dan O(n log n) pasos en promedio para n celdas, y la caminata puede llegar a guardar O(n) celdas.",
      structure: "Una caminata al azar (sin ciclos)",
      texture: "Sin sesgo: todo laberinto perfecto es igual de probable",
    },
  },
});

export const mazeAlgorithms = Object.fromEntries(
  MAZE_ALGORITHMS.map((id) => [
    id,
    { ...text[id], named: text[id].named ?? text[id].title, timeComplexity: timeComplexity[id] },
  ]),
) as Record<MazeAlgorithm, MazeAlgorithmDetails>;

/** A maze's size. In Spanish "laberinto" is masculine, unlike pathfinding's "cuadrícula". */
export const mazeSizeLabels = localized<Record<GridSize, string>>({
  en: { small: "Small", medium: "Medium", large: "Large" },
  es: { small: "Pequeño", medium: "Mediano", large: "Grande" },
});
