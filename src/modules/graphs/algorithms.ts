import { localized } from "@/i18n";
import type { GraphAlgorithm } from "./types";

type GraphAlgorithmText = {
  title: string;
  /** How the name reads mid-sentence ("How … works"), when that differs from the title. */
  named?: string;
  /** Short name for tight spots (pickers on phones). */
  short: string;
  shortDescription: string;
  longDescription: string;
  /** What it keeps the nodes to visit in, as the strip under the graph calls it. */
  structure: string;
};

type GraphAlgorithmData = {
  /**
   * What the badge on each node says: its distance from the start, when it was
   * visited, the cheapest edge that would add it to the tree, which group it's
   * in, or how many edges still come into it (then where it was placed).
   */
  label: "distance" | "order" | "key" | "group" | "indegree";
  /** Uses edge weights (shows them on the edges). */
  weighted: boolean;
  timeComplexity: string;
};

type GraphAlgorithmDetails = GraphAlgorithmText & GraphAlgorithmData & { named: string };

// Key order is the order shown in the UI.
const data: Record<GraphAlgorithm, GraphAlgorithmData> = {
  bfs: { label: "distance", weighted: false, timeComplexity: "O(V + E)" },
  dfs: { label: "order", weighted: false, timeComplexity: "O(V + E)" },
  dijkstra: { label: "distance", weighted: true, timeComplexity: "O((V + E) log V)" },
  prim: { label: "key", weighted: true, timeComplexity: "O((V + E) log V)" },
  kruskal: { label: "group", weighted: true, timeComplexity: "O(E log E)" },
  topo: { label: "indegree", weighted: false, timeComplexity: "O(V + E)" },
};

const text = localized<Record<GraphAlgorithm, GraphAlgorithmText>>({
  en: {
    bfs: {
      title: "Breadth-First Search",
      short: "BFS",
      shortDescription: "Visits every node one edge away, then two, then three, using a queue. The tree it leaves holds the fewest-edges route to every node.",
      longDescription: "Breadth-First Search (BFS) keeps the nodes to visit in a queue: first in, first out. It takes the start, adds all its neighbours to the back of the queue, then takes the next node from the front, and so on. Because nodes leave in the order they arrived, the search moves outwards in layers: everything at distance 1, then everything at distance 2. The edges it first reached each node by form a tree, and the path along that tree is the one with the fewest edges. It ignores weights. It runs in O(V + E) time, for V nodes and E edges.",
      structure: "Queue",
    },
    dfs: {
      title: "Depth-First Search",
      short: "DFS",
      shortDescription: "Follows one branch as far as it goes, then backs up to the last node with an unvisited neighbour. The stack is the path it's on.",
      longDescription: "Depth-First Search (DFS) goes as deep as it can before it backtracks. From each node it takes the first neighbour it hasn't visited and goes there, keeping the nodes it came through on a stack. When a node has no unvisited neighbours left, it's done: DFS pops it and goes back to the node before. The stack is always a path from the start to where the search is now. DFS is the basis for finding cycles, connected parts and topological order. It runs in O(V + E) time.",
      structure: "Stack",
    },
    dijkstra: {
      title: "Dijkstra's Algorithm",
      short: "Dijkstra",
      shortDescription: "Always settles the closest node not yet settled, so it finds the cheapest route to every node when edges have weights.",
      longDescription: "Dijkstra's algorithm keeps the best known distance to each node and a set of open nodes, ordered by that distance (a priority queue). Each round it takes the open node with the smallest distance: no cheaper way to reach it can turn up later, so its distance is final. Then it looks along each edge from it, and if going through it makes a neighbour cheaper to reach, it lowers that neighbour's distance. With every weight equal it behaves like BFS. It needs weights that aren't negative. With a binary heap it runs in O((V + E) log V).",
      structure: "Priority queue",
    },
    prim: {
      title: "Prim's Algorithm",
      short: "Prim",
      shortDescription: "Grows one tree from the start, always adding the cheapest edge that reaches a new node. Ends with the lightest tree that joins them all.",
      longDescription: "Prim's algorithm builds a minimum spanning tree: the set of edges that connects every node with the smallest total weight. It starts from one node and keeps, for each node outside the tree, the cheapest edge that would bring it in (its key). Each round it adds the node with the smallest key, then looks along that node's edges to see if any outside node now has a cheaper way in. It's Dijkstra with one change: the key is the weight of a single edge, not the distance from the start. Spanning trees are how you'd lay the least cable between buildings. With a binary heap it runs in O((V + E) log V).",
      structure: "Priority queue",
    },
    kruskal: {
      title: "Kruskal's Algorithm",
      short: "Kruskal",
      shortDescription: "Takes edges lightest first and keeps each one that joins two separate groups. Many small trees merge into one.",
      longDescription: "Kruskal's algorithm also builds a minimum spanning tree, but edge by edge instead of node by node. It sorts every edge by weight and goes through them, lightest first. Each node starts in a group of its own; an edge whose ends are in different groups goes in the tree and merges the two groups, and an edge whose ends are already in the same group is skipped, since it would close a loop. Keeping track of the groups is the job of a union-find structure. Prim and Kruskal always end with trees of the same total weight. Sorting dominates: O(E log E).",
      structure: "Edges, lightest first",
    },
    topo: {
      title: "Topological Sort",
      short: "Topo sort",
      shortDescription: "Puts the nodes of a directed graph in an order where every edge points forwards, like tasks after the tasks they depend on.",
      longDescription: "A topological sort orders the nodes of a directed graph so that every edge goes from an earlier node to a later one: courses after their prerequisites, build steps after the steps they need. Kahn's algorithm counts the edges coming into each node and starts with the nodes that have none. Each time it places a node, it crosses out the edges leading out of it; a node whose count drops to zero is ready to be placed. If nodes are left over at the end, the graph has a loop and no such order exists. On an undirected graph, edges here point from the earlier letter to the later one. It runs in O(V + E) time.",
      structure: "Ready list",
    },
  },
  es: {
    bfs: {
      title: "Búsqueda en anchura",
      named: "la búsqueda en anchura",
      short: "BFS",
      shortDescription: "Visita cada nodo a una arista de distancia, después a dos, después a tres, con una cola. El árbol que deja tiene la ruta con menos aristas hacia cada nodo.",
      longDescription: "La búsqueda en anchura (BFS) guarda los nodos por visitar en una cola: el primero que entra es el primero que sale. Toma el inicio, agrega todos sus vecinos al final de la cola, después toma el siguiente nodo del frente, y así sigue. Como los nodos salen en el orden en que llegaron, la búsqueda avanza por capas: todo lo que está a distancia 1, después todo lo que está a distancia 2. Las aristas por las que llegó primero a cada nodo forman un árbol, y el camino por ese árbol es el de menos aristas. Ignora los pesos. Tarda O(V + E), para V nodos y E aristas.",
      structure: "Cola",
    },
    dfs: {
      title: "Búsqueda en profundidad",
      named: "la búsqueda en profundidad",
      short: "DFS",
      shortDescription: "Sigue una rama hasta el final y después retrocede al último nodo con un vecino sin visitar. La pila es el camino en el que está.",
      longDescription: "La búsqueda en profundidad (DFS) llega tan hondo como puede antes de retroceder. Desde cada nodo va al primer vecino que no visitó, y guarda en una pila los nodos por los que pasó. Cuando a un nodo no le quedan vecinos sin visitar, terminó con él: DFS lo saca de la pila y vuelve al nodo anterior. La pila siempre es un camino desde el inicio hasta donde está la búsqueda. DFS es la base para encontrar ciclos, partes conectadas y el orden topológico. Tarda O(V + E).",
      structure: "Pila",
    },
    dijkstra: {
      title: "Algoritmo de Dijkstra",
      named: "el algoritmo de Dijkstra",
      short: "Dijkstra",
      shortDescription: "Siempre fija el nodo más cercano que todavía no fijó, así que encuentra la ruta más barata a cada nodo cuando las aristas tienen pesos.",
      longDescription: "El algoritmo de Dijkstra guarda la mejor distancia conocida a cada nodo y un conjunto de nodos abiertos, ordenados por esa distancia (una cola de prioridad). En cada ronda toma el nodo abierto con la menor distancia: ya no puede aparecer una forma más barata de llegar a él, así que su distancia es definitiva. Después mira cada arista que sale de él, y si pasar por él abarata llegar a un vecino, baja la distancia de ese vecino. Si todos los pesos son iguales se comporta como BFS. Necesita pesos que no sean negativos. Con un montículo binario tarda O((V + E) log V).",
      structure: "Cola de prioridad",
    },
    prim: {
      title: "Algoritmo de Prim",
      named: "el algoritmo de Prim",
      short: "Prim",
      shortDescription: "Hace crecer un árbol desde el inicio, siempre con la arista más barata que llega a un nodo nuevo. Termina con el árbol más liviano que los une a todos.",
      longDescription: "El algoritmo de Prim construye un árbol de expansión mínima: el conjunto de aristas que conecta todos los nodos con el menor peso total. Empieza en un nodo y guarda, para cada nodo fuera del árbol, la arista más barata que lo sumaría (su clave). En cada ronda agrega el nodo con la menor clave y mira sus aristas para ver si algún nodo de afuera ahora tiene una entrada más barata. Es Dijkstra con un cambio: la clave es el peso de una sola arista, no la distancia desde el inicio. Los árboles de expansión son la forma de tender el menor cable posible entre edificios. Con un montículo binario tarda O((V + E) log V).",
      structure: "Cola de prioridad",
    },
    kruskal: {
      title: "Algoritmo de Kruskal",
      named: "el algoritmo de Kruskal",
      short: "Kruskal",
      shortDescription: "Toma las aristas de la más liviana a la más pesada y se queda con cada una que une dos grupos separados. Muchos árboles pequeños se funden en uno.",
      longDescription: "El algoritmo de Kruskal también construye un árbol de expansión mínima, pero arista por arista en lugar de nodo por nodo. Ordena todas las aristas por peso y las recorre, de la más liviana a la más pesada. Cada nodo empieza en un grupo propio; una arista cuyos extremos están en grupos distintos entra al árbol y une los dos grupos, y una arista cuyos extremos ya están en el mismo grupo se descarta, porque cerraría un ciclo. Llevar la cuenta de los grupos es el trabajo de una estructura union-find. Prim y Kruskal siempre terminan con árboles del mismo peso total. Lo que más tarda es ordenar: O(E log E).",
      structure: "Aristas, la más liviana primero",
    },
    topo: {
      title: "Orden topológico",
      named: "el orden topológico",
      short: "Topológico",
      shortDescription: "Pone los nodos de un grafo dirigido en un orden donde cada arista apunta hacia adelante, como tareas después de las tareas de las que dependen.",
      longDescription: "Un orden topológico ordena los nodos de un grafo dirigido de modo que cada arista vaya de un nodo anterior a uno posterior: materias después de sus correlativas, pasos de compilación después de los pasos que necesitan. El algoritmo de Kahn cuenta las aristas que entran a cada nodo y empieza por los nodos que no tienen ninguna. Cada vez que ubica un nodo, tacha las aristas que salen de él; un nodo cuyo conteo llega a cero está listo para ubicarse. Si al final sobran nodos, el grafo tiene un ciclo y no existe tal orden. En un grafo no dirigido, aquí las aristas apuntan de la letra anterior a la posterior. Tarda O(V + E).",
      structure: "Lista de listos",
    },
  },
});

export const graphAlgorithms = Object.fromEntries(
  (Object.keys(data) as GraphAlgorithm[]).map((id) => [id, { ...text[id], ...data[id], named: text[id].named ?? text[id].title }])
) as Record<GraphAlgorithm, GraphAlgorithmDetails>;

/** What the race view is and what to watch for: next to the racers, in the articles and in search results. */
export const raceDescription = localized({
  en: "Same graph, same clock. Each tick, every algorithm takes one step, so the first to finish is the one with the least to do. Prim and Kruskal always end with trees of the same weight, by different routes.",
  es: "Mismo grafo, mismo reloj. En cada tic, cada algoritmo da un paso, así que el primero en terminar es el que tiene menos trabajo. Prim y Kruskal siempre terminan con árboles del mismo peso, por caminos distintos.",
});
