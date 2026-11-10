import { localized } from "@/i18n";
import { MAZE_ALGORITHMS, type MazeAlgorithm } from "@/mazes";
import type { GridSize } from "@/pathfinding";

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

const timeComplexity: Record<MazeAlgorithm, string> = { dfs: "O(n)" };

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
