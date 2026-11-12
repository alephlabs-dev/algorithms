import { describe, expect, it } from "vitest";
import { searchFor } from "@/navigation";
import { EXAMPLE_SPEED, defaultsOf, openLink, reopened, stateFor, within } from "@/modules/testing";
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
      expect(searchFor(change(state))).not.toBe(searchFor(state));
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

describe("graphs' captured links", () => {
  // Full links as the app wrote them before the link codecs moved into the modules (#128), opened on a
  // phone held upright: old shared links keep opening the same run.
  const links: [path: string, query: string][] = [
    ["/graphs/depth-first-search", "?graph=AloGAABCW1G2gj67j9M66NMJAAIHBAIHBQMFBAMDAAEHAwIBAQMFAQIDAQUD&nodes=small&layout=random&race=dfs%2Ckruskal&speed=2x"],
    ["/graphs/race", "?graph=AloGAABCW1G2gj67j9M66NMJAAIHBAIHBQMFBAMDAAEHAwIBAQMFAQIDAQUD&nodes=small&layout=random&race=dfs%2Ckruskal&speed=2x"],
  ];

  it("round-trips a full link of every page kind it writes", () => {
    for (const [path, query] of links) expect(reopened(path, query), path + query).toBe(query);
  });

  it("falls back to the defaults on values it doesn't have", () => {
    const s = openLink("/graphs/prim", "?graph=***&nodes=huge&layout=star&race=prim");
    const d = defaultsOf("/graphs/prim");
    expect(s.graphs).toMatchObject({ size: d.graphs.size, preset: "random", racers: d.graphs.racers });
  });

  it("keeps racers unique and in order, and rejects too few or too many", () => {
    const racers = (race: string) => openLink("/graphs/race", `?race=${race}`).graphs.racers;
    const d = defaultsOf("/graphs/race").graphs.racers;
    expect(racers("topo,bfs,topo")).toEqual(["bfs", "topo"]);
    expect(racers("dfs")).toEqual(d);
    expect(racers("bfs,dfs,dijkstra,prim,kruskal")).toEqual(d);
    expect(racers("astar,greedy")).toEqual(d);
  });
});
