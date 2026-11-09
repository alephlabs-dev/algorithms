/**
 * Each module's link, through its own code and no browser: the link is read,
 * the module's state is built from it, and the link is written back from that
 * state (#128). Every expected query here is what the app wrote before the
 * link codecs moved into the modules, so old shared links keep opening the same run.
 */
import { describe, expect, it } from "vitest";
import { createAppStore, type StoreState } from "@/appStore";
import { searchFor } from "@/navigation";
import { readLocation } from "@/urlState";

// A phone held upright: the size every captured link was made on.
const open = (path: string, query = "") =>
  createAppStore({ url: readLocation(path, query), isMobile: true, isPortrait: true, theme: "dark" }).getState();

/** Opens a link and writes the link back from the state it opened. */
const reopened = (path: string, query: string) => searchFor(open(path, query));

const roundTrips = (path: string, query: string) => expect(reopened(path, query)).toBe(query);

/** The state a page opens on without a query, to compare fallbacks with. */
const defaults = (path: string): StoreState => open(path);

describe("sorting link", () => {
  it("round-trips a full link", () => {
    roundTrips("/sorting/heap-sort", "?size=20&input=reversed&mode=bars&speed=2x&seed=1lka0qk&race=shell%2Cquick%2Cheap");
    roundTrips("/sorting/race", "?size=10&input=fewUnique&mode=bars&seed=35afkg&race=insertion%2Cmerge");
  });

  it("falls back to the defaults on values it doesn't have", () => {
    const s = open("/sorting/heap-sort", "?size=37&input=shuffled&mode=dots&speed=4&seed=-1&race=quick");
    const d = defaults("/sorting/heap-sort");
    expect(s.sorting).toMatchObject({ size: d.sorting.size, inputOrder: "random", displayMode: "bars", racers: d.sorting.racers });
    expect(s.speedPreset).toBe(d.speedPreset);
  });

  it("keeps racers unique and in order, and rejects too few or too many", () => {
    const racers = (race: string) => open("/sorting/race", `?race=${race}`).sorting.racers;
    const d = defaults("/sorting/race").sorting.racers;
    expect(racers("merge,bubble,merge")).toEqual(["bubble", "merge"]);
    expect(racers("quick")).toEqual(d);
    expect(racers("selection,insertion,bubble,cocktail,shell")).toEqual(d);
    expect(racers("bfs,dfs")).toEqual(d);
  });
});

describe("pathfinding link", () => {
  const grid =
    "?grid=small&cells=VVVVBAAUERUFREAVEVVERBQVEQUAQBVVUQAEFFFRRQBAVVUV&from=1v&to=23&race=bfs%2Castar%2Cgreedy&speed=2x";

  it("round-trips a full link", () => {
    roundTrips("/pathfinding/a-star", grid);
    roundTrips("/pathfinding/race", grid);
  });

  it("falls back to the defaults on values it doesn't have", () => {
    const s = open("/pathfinding/a-star", "?grid=huge&cells=***&from=-1&to=zz&race=bfs");
    const d = defaults("/pathfinding/a-star");
    expect(s.pathfinding).toMatchObject({ gridSize: d.pathfinding.gridSize, racers: d.pathfinding.racers });
  });

  it("keeps racers unique and in order, and rejects too few or too many", () => {
    const racers = (race: string) => open("/pathfinding/race", `?race=${race}`).pathfinding.racers;
    const d = defaults("/pathfinding/race").pathfinding.racers;
    expect(racers("greedy,bfs,greedy")).toEqual(["bfs", "greedy"]);
    expect(racers("astar")).toEqual(d);
    expect(racers("bfs,dfs,dijkstra,astar,greedy")).toEqual(d);
    expect(racers("quick,merge")).toEqual(d);
  });
});

describe("graphs link", () => {
  const graph =
    "?graph=AloGAABCW1G2gj67j9M66NMJAAIHBAIHBQMFBAMDAAEHAwIBAQMFAQIDAQUD&nodes=small&layout=random&race=dfs%2Ckruskal&speed=2x";

  it("round-trips a full link", () => {
    roundTrips("/graphs/depth-first-search", graph);
    roundTrips("/graphs/race", graph);
  });

  it("falls back to the defaults on values it doesn't have", () => {
    const s = open("/graphs/prim", "?graph=***&nodes=huge&layout=star&race=prim");
    const d = defaults("/graphs/prim");
    expect(s.graphs).toMatchObject({ size: d.graphs.size, preset: "random", racers: d.graphs.racers });
  });

  it("keeps racers unique and in order, and rejects too few or too many", () => {
    const racers = (race: string) => open("/graphs/race", `?race=${race}`).graphs.racers;
    const d = defaults("/graphs/race").graphs.racers;
    expect(racers("topo,bfs,topo")).toEqual(["bfs", "topo"]);
    expect(racers("dfs")).toEqual(d);
    expect(racers("bfs,dfs,dijkstra,prim,kruskal")).toEqual(d);
    expect(racers("astar,greedy")).toEqual(d);
  });
});

describe("fourier link", () => {
  it("round-trips a full link", () => {
    roundTrips("/fourier/epicycles", "?circles=25&shape=star&speed=2x");
    roundTrips("/fourier/square-wave", "?circles=10");
  });

  it("falls back to the defaults on values it doesn't have", () => {
    const s = open("/fourier/epicycles", "?circles=999&shape=moon&path=***");
    const d = defaults("/fourier/epicycles");
    expect(s.fourier).toMatchObject({ circles: d.fourier.circles, shape: "heart", path: null });
  });
});

describe("structures link", () => {
  it("round-trips a full link", () => {
    roundTrips("/structures/avl-tree", "?ops=i50.i30.i20.i70.i80.i75.i40&values=large&order=ascending&speed=2x");
    roundTrips("/structures/race", "?ops=i50.i30.i20.i70.i80.i75.i40&values=small&order=example");
  });

  it("falls back to the defaults on values it doesn't have", () => {
    const s = open("/structures/avl-tree", "?ops=x1&values=huge&order=shuffled");
    expect(s.structures).toMatchObject({ size: defaults("/structures/avl-tree").structures.size, preset: "example" });
  });
});

describe("dynamic programming link", () => {
  it("round-trips a full link, with Ñ and accents", () => {
    roundTrips("/dynamic-programming/edit-distance", "?a=A%C3%91O&b=CA%C3%91%C3%93N&speed=2x");
    roundTrips("/dynamic-programming/knapsack", "?items=1x1.3x4.4x5.5x7&cap=7&speed=2x");
    roundTrips("/dynamic-programming/race", "?items=1x1.2x3.3x4&cap=5");
  });

  it("reads words in any case and falls back on words it can't use", () => {
    expect(open("/dynamic-programming/edit-distance", "?a=a%C3%B1o").dp.a).toBe("AÑO");
    const s = open("/dynamic-programming/knapsack", "?a=A1&items=***&cap=99");
    const d = defaults("/dynamic-programming/knapsack");
    expect(s.dp).toMatchObject({ a: d.dp.a, items: d.dp.items, capacity: d.dp.capacity });
  });
});

describe("backtracking link", () => {
  it("round-trips a full link", () => {
    roundTrips("/backtracking/n-queens", "?n=7&speed=2x");
    roundTrips("/backtracking/sudoku", "?puzzle=hard&order=mrv");
    // Row by row is the default and stays out of the link.
    roundTrips("/backtracking/sudoku", "?puzzle=hard");
  });

  it("falls back to the defaults on values it doesn't have", () => {
    const d = defaults("/backtracking/n-queens").backtracking;
    expect(open("/backtracking/n-queens", "?n=3").backtracking.queensN).toBe(d.queensN);
    expect(open("/backtracking/n-queens", "?n=9").backtracking.queensN).toBe(d.queensN);
    expect(open("/backtracking/sudoku", "?puzzle=evil&order=random").backtracking).toMatchObject({
      sudokuPuzzle: d.sudokuPuzzle,
      sudokuOrder: "rows",
    });
  });
});
