import { describe, expect, it } from "vitest";
import { seededRandom } from "@/utils/random";
import { DONE, EDGE_KEPT, type Graph, type GraphAlgorithm } from "./types";
import { decodeGraph, encodeGraph, graphPresets, graphSizes, makeGraph, neighbors, withEdgeToggled } from "./graph";
import { graphTimelineFor } from "./run";

const searches: GraphAlgorithm[] = ["bfs", "dfs", "dijkstra"];

const graphs = (): Graph[] =>
  graphPresets.flatMap((preset) =>
    graphSizes.flatMap((size) =>
      [false, true].flatMap((phone) => [1, 2, 3].map((seed) => makeGraph(preset, size, phone, seededRandom(seed)))),
    ),
  );

/** Reference: the weight of a minimum spanning tree, by trying edges lightest first with a plain search for loops. */
const minimumSpanningWeight = (graph: Graph) => {
  const kept: { a: number; b: number }[] = [];
  let total = 0;
  for (const e of [...graph.edges].sort((p, q) => p.w - q.w)) {
    const seen = new Set([e.a]);
    const queue = [e.a];
    while (queue.length) {
      const n = queue.shift()!;
      for (const k of kept) {
        const m = k.a === n ? k.b : k.b === n ? k.a : -1;
        if (m >= 0 && !seen.has(m)) {
          seen.add(m);
          queue.push(m);
        }
      }
    }
    if (seen.has(e.b)) continue;
    kept.push(e);
    total += e.w;
  }
  return total;
};

/** Reference answers: hops (BFS) and cheapest total weight (Bellman-Ford) from the start. */
const reference = (graph: Graph, weighted: boolean) => {
  const dist = new Array(graph.nodes.length).fill(Infinity);
  dist[graph.start] = 0;
  for (let round = 0; round < graph.nodes.length; round++) {
    for (const e of graph.edges) {
      const w = weighted ? e.w : 1;
      if (dist[e.a] + w < dist[e.b]) dist[e.b] = dist[e.a] + w;
      if (dist[e.b] + w < dist[e.a]) dist[e.a] = dist[e.b] + w;
    }
  }
  return dist;
};

const crosses = (g: Graph, e: { a: number; b: number }, f: { a: number; b: number }) => {
  if (new Set([e.a, e.b, f.a, f.b]).size < 4) return false;
  const o = (p: number, q: number, r: number) =>
    Math.sign(
      (g.nodes[q].x - g.nodes[p].x) * (g.nodes[r].y - g.nodes[p].y) -
        (g.nodes[q].y - g.nodes[p].y) * (g.nodes[r].x - g.nodes[p].x),
    );
  return o(e.a, e.b, f.a) !== o(e.a, e.b, f.b) && o(f.a, f.b, e.a) !== o(f.a, f.b, e.b);
};

describe("graphs", () => {
  it("makes connected layouts whose edges never cross", () => {
    for (const graph of graphs()) {
      expect(reference(graph, false).every(Number.isFinite)).toBe(true);
      for (const e of graph.edges) for (const f of graph.edges) expect(crosses(graph, e, f)).toBe(false);
      expect(graph.nodes.every((n) => n.x > 0 && n.x < 1 && n.y > 0 && n.y < 1)).toBe(true);
    }
  });

  it("keeps nodes apart: at least 1.4 node widths between centers, on any layout", () => {
    for (const graph of graphs()) {
      // In the layout's own proportions; renderers size nodes at about 5% of the shorter side.
      const min = Math.min(
        ...graph.nodes.flatMap((p, i) =>
          graph.nodes.slice(i + 1).map((q) => Math.hypot((p.x - q.x) * graph.aspect, p.y - q.y)),
        ),
      );
      expect(min).toBeGreaterThan(0.14);
    }
  });

  it("visits every node once, and BFS and Dijkstra end with the right distances", () => {
    for (const graph of graphs().filter((g) => !g.directed)) {
      for (const algorithm of searches) {
        const end = graphTimelineFor(algorithm, graph).frameAt(Infinity);
        expect(end.done).toBe(true);
        expect([...end.states].every((s) => s === DONE)).toBe(true);
        expect(new Set(end.order).size).toBe(graph.nodes.length);
        expect(end.pending).toEqual([]);
        if (algorithm !== "dfs") expect([...end.dist]).toEqual(reference(graph, algorithm === "dijkstra"));
      }
    }
  });

  it("builds a tree: every node but the start is reached by exactly one edge, from a node visited before it", () => {
    for (const graph of graphs().filter((g) => !g.directed)) {
      for (const algorithm of [...searches, "prim" as const]) {
        const end = graphTimelineFor(algorithm, graph).frameAt(Infinity);
        graph.nodes.forEach((_, node) => {
          if (node === graph.start) return expect(end.parent[node]).toBe(-1);
          const edge = graph.edges[end.parent[node]];
          const from = edge.a === node ? edge.b : edge.a;
          expect(end.order[from]).toBeLessThan(end.order[node]);
        });
      }
    }
  });

  it("follows edges one way on a directed graph", () => {
    for (const graph of graphs().filter((g) => g.directed)) {
      const end = graphTimelineFor("bfs", graph).frameAt(Infinity);
      // Every edge points rightwards, so nothing can reach the start, and only edges out are followed.
      for (const e of graph.edges) {
        if (end.parent[e.b] === graph.edges.indexOf(e)) expect(end.order[e.a]).toBeLessThan(end.order[e.b]);
        expect(end.parent[e.a] === graph.edges.indexOf(e)).toBe(false);
      }
    }
  });

  it("Prim and Kruskal find spanning trees of the same, smallest weight", () => {
    for (const graph of graphs()) {
      const prim = graphTimelineFor("prim", graph).frameAt(Infinity);
      const kruskal = graphTimelineFor("kruskal", graph).frameAt(Infinity);
      const primEdges = [...prim.parent].filter((e) => e >= 0);
      const kruskalEdges = [...kruskal.edgeStates.keys()].filter((e) => kruskal.edgeStates[e] === EDGE_KEPT);
      expect(primEdges).toHaveLength(graph.nodes.length - 1);
      expect(kruskalEdges).toHaveLength(graph.nodes.length - 1);
      const weight = (edges: number[]) => edges.reduce((sum, e) => sum + graph.edges[e].w, 0);
      expect(weight(primEdges)).toBe(weight(kruskalEdges));
      // Every edge left out would have closed a loop: the tree is as light as it gets (cycle property).
      expect(weight(kruskalEdges)).toBe(minimumSpanningWeight(graph));
      expect(new Set(kruskal.group).size).toBe(1);
      expect(kruskal.edgeQueue).toEqual([]);
    }
  });

  it("places every node after everything that points to it, and notices a loop", () => {
    for (const graph of graphs()) {
      const end = graphTimelineFor("topo", graph).frameAt(Infinity);
      expect([...end.states].every((s) => s === DONE)).toBe(true);
      for (const e of graph.edges) {
        const [from, to] = graph.directed ? [e.a, e.b] : [Math.min(e.a, e.b), Math.max(e.a, e.b)];
        expect(end.order[from]).toBeLessThan(end.order[to]);
      }
    }
    const dag = makeGraph("dag", "small", false, seededRandom(2));
    const e = dag.edges[0];
    const loop = { ...dag, edges: [...dag.edges.slice(1), { a: e.b, b: e.a, w: 1 }, ...dag.edges.slice(0, 1)] };
    const end = graphTimelineFor("topo", loop).frameAt(Infinity);
    expect([...end.states].some((s) => s !== DONE)).toBe(true);
  });

  it("keeps a queue for BFS and a stack for DFS", () => {
    const graph = makeGraph("tree", "medium", false, seededRandom(4));
    const bfs = graphTimelineFor("bfs", graph);
    // The first node out of a queue is the first one in: the start, then its neighbours in order.
    const firstOut = bfs.frameAt(Infinity).order.indexOf(1);
    expect(firstOut).toBe(neighbors(graph, graph.start)[0].node);
    const dfs = graphTimelineFor("dfs", graph);
    // DFS's stack is always a path from the start: each node joined to the one below it.
    for (let i = 0; i < dfs.length; i++) {
      const { pending } = dfs.frameAt(i);
      for (let k = 1; k < pending.length; k++) {
        expect(neighbors(graph, pending[k - 1]).some((n) => n.node === pending[k])).toBe(true);
      }
    }
  });

  it("packs a graph into a link and back, and toggles edges", () => {
    const graph = makeGraph("random", "large", false, seededRandom(9));
    const back = decodeGraph(encodeGraph(graph))!;
    expect(decodeGraph(encodeGraph(makeGraph("dag", "small", false, seededRandom(1))))!.directed).toBe(true);
    expect(back.edges).toEqual(graph.edges);
    expect(back.start).toBe(graph.start);
    back.nodes.forEach((n, k) => expect(Math.abs(n.x - graph.nodes[k].x)).toBeLessThan(0.003));
    expect(decodeGraph("not a graph")).toBeNull();
    const e = graph.edges[0];
    expect(withEdgeToggled(graph, e.a, e.b).edges).toHaveLength(graph.edges.length - 1);
    expect(withEdgeToggled(withEdgeToggled(graph, e.a, e.b), e.a, e.b).edges).toHaveLength(graph.edges.length);
  });
});
