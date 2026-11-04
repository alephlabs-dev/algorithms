import { describe, expect, it } from "vitest";
import { seededRandom } from "@/utils/random";
import {
  DONE,
  decodeGraph,
  encodeGraph,
  graphPresets,
  graphSizes,
  graphTimelineFor,
  makeGraph,
  neighbors,
  withEdgeToggled,
  type Graph,
  type GraphAlgorithm,
} from ".";

const algorithms: GraphAlgorithm[] = ["bfs", "dfs", "dijkstra"];

const graphs = (): Graph[] =>
  graphPresets.flatMap((preset) =>
    graphSizes.flatMap((size) =>
      [false, true].flatMap((phone) => [1, 2, 3].map((seed) => makeGraph(preset, size, phone, seededRandom(seed)))),
    ),
  );

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

  it("visits every node once, and BFS and Dijkstra end with the right distances", () => {
    for (const graph of graphs()) {
      for (const algorithm of algorithms) {
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
    for (const graph of graphs()) {
      for (const algorithm of algorithms) {
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
    expect(back.edges).toEqual(graph.edges);
    expect(back.start).toBe(graph.start);
    back.nodes.forEach((n, k) => expect(Math.abs(n.x - graph.nodes[k].x)).toBeLessThan(0.003));
    expect(decodeGraph("not a graph")).toBeNull();
    const e = graph.edges[0];
    expect(withEdgeToggled(graph, e.a, e.b).edges).toHaveLength(graph.edges.length - 1);
    expect(withEdgeToggled(withEdgeToggled(graph, e.a, e.b), e.a, e.b).edges).toHaveLength(graph.edges.length);
  });
});
