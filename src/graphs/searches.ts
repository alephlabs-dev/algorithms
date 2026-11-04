import { neighbors } from "./graph";
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

export const graphSearches: Record<GraphAlgorithm, GraphSearch> = { bfs, dfs, dijkstra };

export const graphPseudocode: Record<GraphAlgorithm, string[]> = {
  bfs: bfsPseudocode,
  dfs: dfsPseudocode,
  dijkstra: dijkstraPseudocode,
};
