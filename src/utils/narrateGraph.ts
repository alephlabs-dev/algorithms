import { graphAlgorithms } from "@/consts/graphAlgorithms";
import {
  DONE,
  EDGE_KEPT,
  edgeName,
  nodeName,
  otherEnd,
  type GraphAlgorithm,
  type GraphFrame,
  type GraphTimeline,
} from "@/graphs";
import { localized } from "@/i18n";

type Ending = "bfs" | "dfs" | "dijkstra";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const text = localized({
  en: {
    idle: "Press play to start. Drag nodes, tap two to join them, double-tap one to start there.",
    ending: {
      bfs: "The green edges reach each one in the fewest edges.",
      dfs: "The green edges are the tree the search made.",
      dijkstra: "The green edges are the cheapest route to each one.",
    } as Record<Ending, string>,
    /** What the search keeps its nodes in, as the sentences name it. */
    structure: (structure: string) => structure,
    topoReadyFirst: (name: string) => `${name} has nothing coming in: it's ready.`,
    topoReady: (name: string) => `Nothing else comes into ${name}: it's ready.`,
    primStart: (name: string) => `Start the tree at ${name}.`,
    primCheaper: (name: string, dist: number, old: number) => `A cheaper way to bring in ${name}: weight ${dist} instead of ${old}.`,
    primCould: (name: string, edge: string, dist: number) => `${name} could join through ${edge}, weight ${dist}.`,
    startWeighted: (name: string) => `Start at ${name}, at distance 0.`,
    startAdd: (name: string, structure: string) => `Start at ${name}: add it to the ${structure}.`,
    deeper: (name: string) => `${name} is new: go deeper, to ${name}.`,
    queueBack: (name: string, dist: number) => `${name} is new: add it to the back of the queue, at distance ${dist}.`,
    cheaperTo: (name: string, dist: number, old: number) => `A cheaper way to ${name}: ${dist} instead of ${old}.`,
    reachable: (name: string, dist: number) => `${name} can now be reached at distance ${dist}: add it to the open set.`,
    place: (name: string, n: number) => `Place ${name}, number ${n} in the order.`,
    primFirst: (name: string) => `${name} is the tree's first node.`,
    primJoins: (name: string, dist: number) => `${name} has the cheapest way in, weight ${dist}: it joins the tree.`,
    visit: (name: string, n: number) => `Visit ${name}, number ${n}.`,
    takeFront: (name: string, dist: number) => `Take ${name} from the front of the queue (distance ${dist}).`,
    closest: (name: string, dist: number) => `${name} is the closest open node, at ${dist}: that distance is final.`,
    weight: (w: number) => ` (weight ${w})`,
    crossOut: (from: string, to: string) => `Cross out ${from}→${to}: it's accounted for now.`,
    inTree: (label: string, to: string) => `Look along ${label}: ${to} is already in the tree.`,
    cheaperThanAny: (label: string, to: string, old: string) => `Look along ${label}: cheaper than any way in ${to} had (${old}).`,
    asCheap: (label: string, to: string, old: string) => `Look along ${label}: ${to} already has a way in as cheap, ${old}.`,
    final: (label: string, to: string) => `Look along ${label}: ${to} is already final.`,
    through: (label: string, from: string, to: string, d: number, w: number, total: number) =>
      `Look along ${label}: through ${from}, ${to} costs ${d} + ${w} = ${total}.`,
    noBetter: (label: string, total: number, old: string) => `Look along ${label}: ${total} is no better than ${old}. Keep it.`,
    notReached: (label: string, to: string) => `Look along ${label}: ${to} hasn't been reached yet.`,
    reached: (label: string, to: string) => `Look along ${label}: ${to} was already reached. Skip it.`,
    noneLeft: (name: string) => `${name} has no edges left coming in.`,
    stillHas: (name: string, left: number) => `${name} still has ${plural(left, "edge")} coming in.`,
    backTo: (name: string) => `: back to ${name}`,
    noUnvisited: (name: string, back: string) => `${name} has no unvisited neighbours left${back}.`,
    lineUp: (n: number) => `Line up all ${plural(n, "edge")}, lightest first. Every node starts in a group of its own.`,
    nextLightest: (edge: string, w: number) => `Next lightest: ${edge}, weight ${w}.`,
    joins: (edge: string, from: string, into: string) =>
      `${edge} joins two groups: keep it, and group ${from} merges into group ${into}.`,
    loop: (a: string, b: string, edge: string) => `${a} and ${b} are already in one group: ${edge} would close a loop. Skip it.`,
    topoDone: "Done: every node is placed after everything that points to it.",
    stuck: (left: number) =>
      `Stuck: ${plural(left, "node")} still have edges coming in, so the graph has a loop and no order exists.`,
    treeDone: (weight: number) => `Done: the green edges join the nodes with the smallest possible total weight, ${weight}.`,
    searchDone: (start: string, ending: string) => `Every node reachable from ${start} is visited. ${ending}`,
  },
  es: {
    idle: "Presiona play. Arrastra los nodos, toca dos para unirlos y toca dos veces uno para empezar ahí.",
    ending: {
      bfs: "Las aristas verdes son los caminos con menos aristas.",
      dfs: "Las aristas verdes son el árbol que armó la búsqueda.",
      dijkstra: "Las aristas verdes son la ruta más barata a cada nodo.",
    },
    structure: (structure) => ({ queue: "la cola", stack: "la pila" })[structure] ?? structure,
    topoReadyFirst: (name) => `A ${name} no le llega nada: está listo.`,
    topoReady: (name) => `Ya no le llega nada más a ${name}: está listo.`,
    primStart: (name) => `Empieza el árbol en ${name}.`,
    primCheaper: (name, dist, old) => `Una forma más barata de sumar ${name}: peso ${dist} en vez de ${old}.`,
    primCould: (name, edge, dist) => `${name} podría unirse por ${edge}, peso ${dist}.`,
    startWeighted: (name) => `Empieza en ${name}, a distancia 0.`,
    startAdd: (name, structure) => `Empieza en ${name}: agrégalo a ${structure}.`,
    deeper: (name) => `${name} es nuevo: baja más, hasta ${name}.`,
    queueBack: (name, dist) => `${name} es nuevo: agrégalo al final de la cola, a distancia ${dist}.`,
    cheaperTo: (name, dist, old) => `Una forma más barata de llegar a ${name}: ${dist} en vez de ${old}.`,
    reachable: (name, dist) => `Ya se puede llegar a ${name} a distancia ${dist}: agrégalo al conjunto abierto.`,
    place: (name, n) => `Ubica ${name}, el número ${n} en el orden.`,
    primFirst: (name) => `${name} es el primer nodo del árbol.`,
    primJoins: (name, dist) => `${name} tiene la entrada más barata, peso ${dist}: se une al árbol.`,
    visit: (name, n) => `Visita ${name}, el número ${n}.`,
    takeFront: (name, dist) => `Toma ${name} del frente de la cola (distancia ${dist}).`,
    closest: (name, dist) => `${name} es el nodo abierto más cercano, a ${dist}: esa distancia es definitiva.`,
    weight: (w) => ` (peso ${w})`,
    crossOut: (from, to) => `Tacha ${from}→${to}: ya está contada.`,
    inTree: (label, to) => `Mira ${label}: ${to} ya está en el árbol.`,
    cheaperThanAny: (label, to, old) => `Mira ${label}: más barata que cualquier entrada que tenía ${to} (${old}).`,
    asCheap: (label, to, old) => `Mira ${label}: ${to} ya tiene una entrada igual de barata, ${old}.`,
    final: (label, to) => `Mira ${label}: ${to} ya es definitivo.`,
    through: (label, from, to, d, w, total) => `Mira ${label}: pasando por ${from}, ${to} cuesta ${d} + ${w} = ${total}.`,
    noBetter: (label, total, old) => `Mira ${label}: ${total} no mejora ${old}. Se queda como está.`,
    notReached: (label, to) => `Mira ${label}: todavía no se llegó a ${to}.`,
    reached: (label, to) => `Mira ${label}: ya se llegó a ${to}. Sáltala.`,
    noneLeft: (name) => `A ${name} ya no le entra ninguna arista.`,
    stillHas: (name, left) => `A ${name} todavía ${left === 1 ? "le entra 1 arista" : `le entran ${left} aristas`}.`,
    backTo: (name) => `: vuelve a ${name}`,
    noUnvisited: (name, back) => `A ${name} no le quedan vecinos sin visitar${back}.`,
    lineUp: (n) =>
      `Ordena ${n === 1 ? "la única arista" : `las ${n} aristas`}, la más liviana primero. Cada nodo empieza en un grupo propio.`,
    nextLightest: (edge, w) => `La siguiente más liviana: ${edge}, peso ${w}.`,
    joins: (edge, from, into) => `${edge} une dos grupos: se queda, y el grupo ${from} se funde con el grupo ${into}.`,
    loop: (a, b, edge) => `${a} y ${b} ya están en el mismo grupo: ${edge} cerraría un ciclo. Sáltala.`,
    topoDone: "Listo: cada nodo quedó después de todos los que apuntan a él.",
    stuck: (left) =>
      `Trabado: a ${left === 1 ? "1 nodo todavía le entran" : `${left} nodos todavía les entran`} aristas, así que el grafo tiene un ciclo y no existe un orden.`,
    treeDone: (weight) => `Listo: las aristas verdes unen los nodos con el menor peso total posible, ${weight}.`,
    searchDone: (start, ending) => `Se visitó todo lo alcanzable desde ${start}. ${ending}`,
  },
});

const distance = (value: number) => (Number.isFinite(value) ? String(value) : "∞");

/** Total weight of a spanning tree as the frame has it: Prim's tree edges, or Kruskal's kept ones. */
const treeWeight = (timeline: GraphTimeline, frame: GraphFrame) => {
  const edges = timeline.graph.edges;
  if (timeline.structure === "edges") {
    return edges.reduce((sum, e, k) => sum + (frame.edgeStates[k] === EDGE_KEPT ? e.w : 0), 0);
  }
  return [...frame.parent].reduce((sum, e) => sum + (e >= 0 ? edges[e].w : 0), 0);
};

/** The step into frame `index`, in one plain sentence. */
export const narrateGraph = (timeline: GraphTimeline, index: number, algorithm: GraphAlgorithm): string => {
  const step = timeline.stepAt(index);
  if (!step) return text.idle;
  const { graph, structure } = timeline;
  const before = timeline.frameAt(index - 1);
  const after = timeline.frameAt(index);
  const { weighted } = graphAlgorithms[algorithm];
  const next = timeline.stepAt(index + 1);

  switch (step.type) {
    case "push": {
      const name = nodeName(step.node);
      if (algorithm === "topo") {
        return step.edge === null && before.stats.visited === 0 ? text.topoReadyFirst(name) : text.topoReady(name);
      }
      if (algorithm === "prim") {
        if (step.edge === null) return text.primStart(name);
        return Number.isFinite(before.dist[step.node])
          ? text.primCheaper(name, step.dist, before.dist[step.node])
          : text.primCould(name, edgeName(graph, step.edge), step.dist);
      }
      if (step.edge === null) {
        return weighted ? text.startWeighted(name) : text.startAdd(name, text.structure(structure));
      }
      if (structure === "stack") return text.deeper(name);
      if (structure === "queue") return text.queueBack(name, step.dist);
      return Number.isFinite(before.dist[step.node])
        ? text.cheaperTo(name, step.dist, before.dist[step.node])
        : text.reachable(name, step.dist);
    }
    case "pop": {
      const name = nodeName(step.node);
      if (algorithm === "topo") return text.place(name, after.order[step.node] + 1);
      if (algorithm === "prim") {
        return step.node === graph.start ? text.primFirst(name) : text.primJoins(name, after.dist[step.node]);
      }
      if (structure === "stack") return text.visit(name, after.order[step.node] + 1);
      if (structure === "queue") return text.takeFront(name, after.dist[step.node]);
      return text.closest(name, after.dist[step.node]);
    }
    case "edge": {
      const edge = graph.edges[step.edge];
      const from = after.current!;
      const to = otherEnd(edge, from);
      const label = `${edgeName(graph, step.edge)}${weighted ? text.weight(edge.w) : ""}`;
      const leadsOn = next?.type === "push" && next.node === to;
      if (algorithm === "topo") return text.crossOut(nodeName(from), nodeName(to));
      if (algorithm === "prim") {
        if (before.states[to] === DONE) return text.inTree(label, nodeName(to));
        return leadsOn
          ? text.cheaperThanAny(label, nodeName(to), distance(before.dist[to]))
          : text.asCheap(label, nodeName(to), distance(before.dist[to]));
      }
      if (weighted) {
        if (before.states[to] === DONE) return text.final(label, nodeName(to));
        const through = before.dist[from] + edge.w;
        return leadsOn
          ? text.through(label, nodeName(from), nodeName(to), before.dist[from], edge.w, through)
          : text.noBetter(label, through, distance(before.dist[to]));
      }
      return leadsOn ? text.notReached(label, nodeName(to)) : text.reached(label, nodeName(to));
    }
    case "lower": {
      const left = after.indegree[step.node];
      return left === 0 ? text.noneLeft(nodeName(step.node)) : text.stillHas(nodeName(step.node), left);
    }
    case "back": {
      const back = after.current === null ? "" : text.backTo(nodeName(after.current));
      return text.noUnvisited(nodeName(step.node), back);
    }
    case "sort":
      return text.lineUp(step.edges.length);
    case "consider":
      return text.nextLightest(edgeName(graph, step.edge), graph.edges[step.edge].w);
    case "join":
      return text.joins(edgeName(graph, step.edge), nodeName(step.from), nodeName(step.into));
    case "reject": {
      const { a, b } = graph.edges[step.edge];
      return text.loop(nodeName(a), nodeName(b), edgeName(graph, step.edge));
    }
    case "done": {
      if (algorithm === "topo") {
        const left = after.states.filter((s) => s !== DONE).length;
        return left === 0 ? text.topoDone : text.stuck(left);
      }
      if (algorithm === "prim" || algorithm === "kruskal") return text.treeDone(treeWeight(timeline, after));
      return text.searchDone(nodeName(graph.start), text.ending[algorithm]);
    }
  }
};
