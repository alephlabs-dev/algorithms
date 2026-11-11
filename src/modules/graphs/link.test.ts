import { describe, expect, it } from "vitest";
import { engines } from "@/modules/engine";
import { EXAMPLE_SPEED, stateFor, within } from "@/modules/testing";
import { routePath } from "@/routes";
import { readLocation } from "@/urlState";
import { seededRandom } from "@/utils/random";
import { decodeGraph, encodeGraph, makeGraph } from "./graph";
import { graphsLink } from "./link";
import { graphsManifest } from "./manifest";
import type { GraphAlgorithm } from "./types";

describe("graphs' link", () => {
  it("opens its example link with every setting the link carries", () => {
    // A link rounds node positions to 1/255, so the slice holds the graph as the link brings it back.
    const tree = decodeGraph(encodeGraph(makeGraph("tree", "large", false, seededRandom(5))))!;
    expect(graphsManifest.example.search).toBe(
      graphsLink.write({ graph: encodeGraph(tree), size: "large", preset: "tree", racers: ["prim", "kruskal"] }, EXAMPLE_SPEED),
    );
    expect(stateFor("graphs", "single", false).graphs).toMatchObject({
      algorithm: "dijkstra",
      size: "large",
      preset: "tree",
      graph: tree,
      racers: ["prim", "kruskal"],
    });
  });

  it("puts every setting it shares in its link, so editing it changes the link", () => {
    const changes = [
      within("graphs", { graph: makeGraph("grid", "large", false, seededRandom(2)) }),
      within("graphs", { preset: "dag" }),
      within("graphs", { racers: ["bfs", "topo"] }),
    ];
    for (const change of changes) {
      const state = stateFor("graphs", "single", false);
      expect(engines.graphs.search(change(state))).not.toBe(engines.graphs.search(state));
    }
  });

  describe("url state", () => {
    it("round-trips a graph page", () => {
      const graph = {
        graph: "AQEC_-9",
        size: "large" as const,
        preset: "tree" as const,
        racers: ["dfs", "kruskal"] as GraphAlgorithm[],
      };
      const query = graphsLink.write(graph, "1x");
      expect(readLocation(routePath({ module: "graphs", page: "algorithm", algorithm: "dfs" }), query)).toMatchObject({
        module: "graphs",
        link: { algorithm: "dfs", params: graph },
      });
      expect(readLocation("/graphs", "").isModuleStart).toBe(true);
    });
  });
});
