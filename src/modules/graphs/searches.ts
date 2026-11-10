import { indegrees, neighbors, outEdges } from "./graph";
import type { GraphAlgorithm, GraphSearch } from "./types";

export const bfsPseudocode = [
  "queue = [start], dist[start] = 0",
  "while the queue isn't empty:",
  "  node = take the first node in the queue",
  "  for each edge (node, n):",
  "    if n hasn't been reached yet:",
  "      dist[n] = dist[node] + 1",
  "      add n to the end of the queue",
];

/** Breadth-first: everything one edge away, then two, then three. Distances are in edges. */
const bfs: GraphSearch = function* (graph) {
  const dist = new Map([[graph.start, 0]]);
  const queue = [graph.start];
  yield { type: "push", node: graph.start, edge: null, dist: 0, line: 0 };
  while (queue.length) {
    const node = queue.shift()!;
    yield { type: "pop", node, line: 2 };
    for (const { edge, node: n } of neighbors(graph, node)) {
      yield { type: "edge", edge, line: 3 };
      if (dist.has(n)) continue;
      dist.set(n, dist.get(node)! + 1);
      queue.push(n);
      yield { type: "push", node: n, edge, dist: dist.get(n)!, line: 6 };
    }
  }
  yield { type: "done" };
};

export const dfsPseudocode = [
  "visit(start)",
  "visit(node):",
  "  mark node as visited",
  "  for each edge (node, n):",
  "    if n isn't visited: visit(n)",
  "  done with node: go back",
];

/** Depth-first: follows one branch as far as it goes, then backs up to the last fork. */
const dfs: GraphSearch = function* (graph) {
  const visited = new Set<number>();
  // An explicit stack of (node, its remaining edges), the same as the recursion would keep.
  const stack: { node: number; next: { edge: number; node: number }[] }[] = [];
  const enter = (node: number) => {
    visited.add(node);
    stack.push({ node, next: neighbors(graph, node) });
  };
  enter(graph.start);
  yield { type: "push", node: graph.start, edge: null, dist: 0, line: 0 };
  yield { type: "pop", node: graph.start, line: 2 };
  while (stack.length) {
    const top = stack[stack.length - 1];
    const step = top.next.shift();
    if (!step) {
      stack.pop();
      yield { type: "back", node: top.node, line: 5 };
      continue;
    }
    yield { type: "edge", edge: step.edge, line: 3 };
    if (visited.has(step.node)) continue;
    enter(step.node);
    yield { type: "push", node: step.node, edge: step.edge, dist: stack.length - 1, line: 4 };
    yield { type: "pop", node: step.node, line: 2 };
  }
  yield { type: "done" };
};

export const dijkstraPseudocode = [
  "dist[start] = 0, open = {start}",
  "while open isn't empty:",
  "  node = the open node with the smallest dist",
  "  for each edge (node, n) with weight w:",
  "    if dist[node] + w < dist[n]:",
  "      dist[n] = dist[node] + w",
  "      add n to open (or update it)",
];

/** Dijkstra: always settles the closest open node, so each distance is final when it's taken. */
const dijkstra: GraphSearch = function* (graph) {
  const dist = new Map([[graph.start, 0]]);
  const open = new Set([graph.start]);
  const done = new Set<number>();
  yield { type: "push", node: graph.start, edge: null, dist: 0, line: 0 };
  while (open.size) {
    // Ties go to the lower letter, so runs are easy to follow.
    const node = [...open].sort((p, q) => dist.get(p)! - dist.get(q)! || p - q)[0];
    open.delete(node);
    done.add(node);
    yield { type: "pop", node, line: 2 };
    for (const { edge, node: n } of neighbors(graph, node)) {
      yield { type: "edge", edge, line: 3 };
      if (done.has(n)) continue;
      const candidate = dist.get(node)! + graph.edges[edge].w;
      if (candidate >= (dist.get(n) ?? Infinity)) continue;
      dist.set(n, candidate);
      open.add(n);
      yield { type: "push", node: n, edge, dist: candidate, line: 6 };
    }
  }
  yield { type: "done" };
};

export const primPseudocode = [
  "key[start] = 0, open = {start}",
  "while open isn't empty:",
  "  node = the open node with the smallest key",
  "  add node to the tree",
  "  for each edge (node, n) with weight w:",
  "    if n isn't in the tree and w < key[n]:",
  "      key[n] = w, open.add(n)",
];

/** Prim: grows one tree from the start, always adding the cheapest edge that reaches a new node. */
const prim: GraphSearch = function* (graph) {
  const key = new Map([[graph.start, 0]]);
  const open = new Set([graph.start]);
  const inTree = new Set<number>();
  yield { type: "push", node: graph.start, edge: null, dist: 0, line: 0 };
  while (open.size) {
    const node = [...open].sort((p, q) => key.get(p)! - key.get(q)! || p - q)[0];
    open.delete(node);
    inTree.add(node);
    yield { type: "pop", node, line: 3 };
    // A spanning tree doesn't care which way edges point.
    for (const { edge, node: n } of neighbors(graph, node, true)) {
      yield { type: "edge", edge, line: 4 };
      const w = graph.edges[edge].w;
      if (inTree.has(n) || w >= (key.get(n) ?? Infinity)) continue;
      key.set(n, w);
      open.add(n);
      yield { type: "push", node: n, edge, dist: w, line: 6 };
    }
  }
  yield { type: "done" };
};

export const kruskalPseudocode = [
  "sort the edges, lightest first",
  "every node starts in a group of its own",
  "for each edge (a, b), lightest first:",
  "  if a and b are in the same group: skip it",
  "  else: add it to the tree, merge the groups",
];

/** Kruskal: takes edges lightest first, keeping each one that joins two separate groups. */
const kruskal: GraphSearch = function* (graph) {
  const order = graph.edges.map((_, k) => k).sort((p, q) => graph.edges[p].w - graph.edges[q].w || p - q);
  yield { type: "sort", edges: order, line: 0 };
  // Union-find; each group is named by its lowest letter, so names stay put as groups grow.
  const root = graph.nodes.map((_, k) => k);
  const find = (k: number): number => (root[k] === k ? k : (root[k] = find(root[k])));
  for (const edge of order) {
    yield { type: "consider", edge, line: 2 };
    const [ra, rb] = [find(graph.edges[edge].a), find(graph.edges[edge].b)];
    if (ra === rb) {
      yield { type: "reject", edge, line: 3 };
      continue;
    }
    const [into, from] = ra < rb ? [ra, rb] : [rb, ra];
    root[from] = into;
    yield { type: "join", edge, from, into, line: 4 };
  }
  yield { type: "done" };
};

export const topoPseudocode = [
  "count the edges coming into each node",
  "ready = every node with none coming in",
  "while ready isn't empty:",
  "  node = take the first ready node, place it next",
  "  for each edge (node, n):",
  "    one fewer edge comes into n",
  "    if none are left: add n to ready",
  "if some nodes weren't placed: there's a loop",
];

/** Kahn's topological sort: places a node once everything pointing to it is placed. */
const topo: GraphSearch = function* (graph) {
  const left = indegrees(graph);
  const ready: number[] = [];
  for (let node = 0; node < graph.nodes.length; node++) {
    if (left[node] > 0) continue;
    ready.push(node);
    yield { type: "push", node, edge: null, dist: 0, line: 1 };
  }
  while (ready.length) {
    const node = ready.shift()!;
    yield { type: "pop", node, line: 3 };
    for (const { edge, node: n } of outEdges(graph, node)) {
      yield { type: "edge", edge, line: 4 };
      left[n]--;
      yield { type: "lower", node: n, edge, line: 5 };
      if (left[n] > 0) continue;
      ready.push(n);
      yield { type: "push", node: n, edge: null, dist: 0, line: 6 };
    }
  }
  yield { type: "done", line: left.some((count) => count > 0) ? 7 : undefined };
};

export const graphSearches: Record<GraphAlgorithm, GraphSearch> = { bfs, dfs, dijkstra, prim, kruskal, topo };

export const graphPseudocode: Record<GraphAlgorithm, string[]> = {
  bfs: bfsPseudocode,
  dfs: dfsPseudocode,
  dijkstra: dijkstraPseudocode,
  prim: primPseudocode,
  kruskal: kruskalPseudocode,
  topo: topoPseudocode,
};
