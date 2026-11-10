import { describe, expect, it } from "vitest";
import { createAppStore } from "@/appStore";
import { graphAspect } from "./graph";
import { href, routePath } from "@/routes";
import { routeIn } from "@/modules/engine";
import { linkFor, readLocation } from "@/urlState";
import { graphsSlice as slice, type GraphsState } from "./slice";
import { MAX_RACERS, MIN_RACERS, type SliceContext } from "@/modules/slice";

const single: SliceContext = {
  view: "single",
  isModuleStart: false,
  speedPreset: "1x",
  isMobile: false,
  isPortrait: false,
};
const race: SliceContext = { ...single, view: "race" };
const at = (path: string, search = "", ctx = single) => slice.hydrate(linkFor(readLocation(path, search), "graphs"), ctx);
const apply = (s: GraphsState, patch: Partial<GraphsState> | null) => ({ ...s, ...patch });
const large = () => apply(at("/graphs"), slice.actions.setSize(at("/graphs"), single, "large"));

describe("graphs slice", () => {
  it("opens on BFS over a medium random graph, with four racers ready", () => {
    const s = at("/graphs");
    expect([s.algorithm, s.size, s.preset]).toEqual(["bfs", "medium", "random"]);
    expect(s.racers).toHaveLength(4);
    expect(s.raceRuns).toEqual([]);
  });

  it("survives its own link", () => {
    const big = large();
    const s = apply(big, slice.actions.toggleRacer(big, single, "bfs"));
    const search = slice.engine.search(s, single);
    const reopened = at(routePath(routeIn("graphs", slice.current(s), single)), search);
    const settings = ({ algorithm, size, preset, racers }: GraphsState) => ({ algorithm, size, preset, racers });
    expect(settings(reopened)).toEqual(settings(s));
    // Node positions travel rounded, so the graph has to come back as the same link.
    expect(slice.engine.search(reopened, single)).toBe(search);
  });

  it("a race keeps a medium graph, and lays a large one out again at medium", () => {
    const medium = at("/graphs");
    const keep = apply(medium, slice.forView!(medium, race));
    expect(keep.graph).toBe(medium.graph);
    expect(keep.raceRuns).toHaveLength(medium.racers.length);

    const big = large();
    const refit = apply(big, slice.forView!(big, race));
    expect(refit.size).toBe("medium");
    expect(refit.graph).not.toBe(big.graph);
    expect(refit.inputId).toBe(big.inputId + 1);
    expect(refit.raceRuns).toHaveLength(big.racers.length);
  });

  it("keeps between two and four racers", () => {
    let s = at("/graphs");
    expect(slice.actions.toggleRacer(s, single, "topo")).toBeNull(); // already four
    s = apply(s, slice.actions.toggleRacer(s, single, "bfs"));
    s = apply(s, slice.actions.toggleRacer(s, single, "dfs"));
    expect(s.racers).toHaveLength(MIN_RACERS);
    expect(slice.actions.toggleRacer(s, single, "prim")).toBeNull();
    expect(apply(s, slice.actions.toggleRacer(s, single, "topo")).racers.length).toBeLessThanOrEqual(MAX_RACERS);
  });

  it("turning the screen upright lays the graph out upright; staying wide keeps it", () => {
    const s = at("/graphs");
    expect(slice.fit!(s, single)).toBeNull();
    const upright = apply(s, slice.fit!(s, { ...single, isPortrait: true }));
    expect(upright.graph.aspect).toBe(graphAspect(true));
    expect(upright.inputId).toBe(s.inputId + 1);
  });
});

describe("graphs in the store", () => {
  it("turning the screen upright reshapes the graph even while another module is on stage", () => {
    const app = createAppStore({
      url: readLocation(href({ module: "sorting", page: "algorithm", algorithm: "heap" }), ""),
      isMobile: false,
      isPortrait: false,
      theme: "dark",
    });
    const before = app.getState().graphs.graph;
    app.getState().setIsPortrait(true);
    expect(app.getState().graphs.graph).not.toBe(before);
    expect(app.getState().graphs.graph.aspect).toBe(graphAspect(true));
  });
});
