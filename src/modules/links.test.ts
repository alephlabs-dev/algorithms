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
import { moduleOf, modulePages, routeFromPath } from "@/routes";
import { MODULES, type ModuleId } from "./engine";

// A phone held upright: the size every captured link was made on.
const open = (path: string, query = "") =>
  createAppStore({ url: readLocation(path, query), isMobile: true, isPortrait: true, theme: "dark" }).getState();

/** Opens a link and writes the link back from the state it opened. */
const reopened = (path: string, query: string) => searchFor(open(path, query));

/** The state a page opens on without a query, to compare fallbacks with. */
const defaults = (path: string): StoreState => open(path);

/**
 * Full links each module writes, as the app wrote them before #128: an algorithm page,
 * and the race if the module has one. A module in the registry without them fails below.
 */
const ROUND_TRIPS: Partial<Record<ModuleId, [path: string, query: string][]>> = {
  sorting: [
    ["/sorting/heap-sort", "?size=20&input=reversed&mode=bars&speed=2x&seed=1lka0qk&race=shell%2Cquick%2Cheap"],
    ["/sorting/race", "?size=10&input=fewUnique&mode=bars&seed=35afkg&race=insertion%2Cmerge"],
  ],
  pathfinding: [
    ["/pathfinding/a-star", "?grid=small&cells=VVVVBAAUERUFREAVEVVERBQVEQUAQBVVUQAEFFFRRQBAVVUV&from=1v&to=23&race=bfs%2Castar%2Cgreedy&speed=2x"],
    ["/pathfinding/race", "?grid=small&cells=VVVVBAAUERUFREAVEVVERBQVEQUAQBVVUQAEFFFRRQBAVVUV&from=1v&to=23&race=bfs%2Castar%2Cgreedy&speed=2x"],
  ],
  graphs: [
    ["/graphs/depth-first-search", "?graph=AloGAABCW1G2gj67j9M66NMJAAIHBAIHBQMFBAMDAAEHAwIBAQMFAQIDAQUD&nodes=small&layout=random&race=dfs%2Ckruskal&speed=2x"],
    ["/graphs/race", "?graph=AloGAABCW1G2gj67j9M66NMJAAIHBAIHBQMFBAMDAAEHAwIBAQMFAQIDAQUD&nodes=small&layout=random&race=dfs%2Ckruskal&speed=2x"],
  ],
  fourier: [
    ["/fourier/epicycles", "?circles=25&shape=star&speed=2x"],
    ["/fourier/square-wave", "?circles=10"],
  ],
  structures: [
    ["/structures/avl-tree", "?ops=i50.i30.i20.i70.i80.i75.i40&values=large&order=ascending&speed=2x"],
    ["/structures/race", "?ops=i50.i30.i20.i70.i80.i75.i40&values=small&order=example"],
  ],
  dp: [
    ["/dynamic-programming/edit-distance", "?a=A%C3%91O&b=CA%C3%91%C3%93N&speed=2x"],
    ["/dynamic-programming/knapsack", "?items=1x1.3x4.4x5.5x7&cap=7&speed=2x"],
    ["/dynamic-programming/race", "?items=1x1.2x3.3x4&cap=5"],
  ],
  backtracking: [
    ["/backtracking/n-queens", "?n=7&speed=2x"],
    ["/backtracking/sudoku", "?puzzle=hard&order=mrv"],
    // Row by row is the default and stays out of the link.
    ["/backtracking/sudoku", "?puzzle=hard"],
  ],
  mazes: [
    ["/mazes/dfs", "?size=large&seed=1lka0qk&speed=2x"],
    ["/mazes/dfs", "?size=small&seed=0"],
    ["/mazes/wilson", "?size=large&seed=1lka0qk&race=prim%2Cwilson&speed=2x"],
    // Phones race small mazes.
    ["/mazes/race", "?size=small&seed=35afkg&race=dfs%2Ckruskal%2Cwilson"],
  ],
};

describe.each(MODULES)("%s link", (module) => {
  it("round-trips a full link of every page kind it writes", () => {
    const links = ROUND_TRIPS[module];
    expect(links, `${module} needs round-trip links in ROUND_TRIPS`).toBeDefined();
    const pages = new Set(links!.map(([path]) => routeFromPath(path)).map((route) => moduleOf(route!) === module && route!.page));
    expect(pages.has("algorithm"), `${module} needs an algorithm page in ROUND_TRIPS`).toBe(true);
    expect(pages.has("race"), `${module} needs its race page in ROUND_TRIPS`).toBe(modulePages[module].race);
    for (const [path, query] of links!) expect(reopened(path, query), path + query).toBe(query);
  });
});

describe("sorting link", () => {
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
  it("falls back to the defaults on values it doesn't have", () => {
    const s = open("/fourier/epicycles", "?circles=999&shape=moon&path=***");
    const d = defaults("/fourier/epicycles");
    expect(s.fourier).toMatchObject({ circles: d.fourier.circles, shape: "heart", path: null });
  });
});

describe("structures link", () => {
  it("falls back to the defaults on values it doesn't have", () => {
    const s = open("/structures/avl-tree", "?ops=x1&values=huge&order=shuffled");
    expect(s.structures).toMatchObject({ size: defaults("/structures/avl-tree").structures.size, preset: "example" });
  });
});

describe("dynamic programming link", () => {
  it("reads words in any case and falls back on words it can't use", () => {
    expect(open("/dynamic-programming/edit-distance", "?a=a%C3%B1o").dp.a).toBe("AÑO");
    const s = open("/dynamic-programming/knapsack", "?a=A1&items=***&cap=99");
    const d = defaults("/dynamic-programming/knapsack");
    expect(s.dp).toMatchObject({ a: d.dp.a, items: d.dp.items, capacity: d.dp.capacity });
  });
});

describe("backtracking link", () => {
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

describe("mazes link", () => {
  it("falls back to the defaults on values it doesn't have, with a fresh seed", () => {
    const s = open("/mazes/dfs", "?size=huge&seed=***");
    expect(s.mazes.size).toBe(defaults("/mazes/dfs").mazes.size);
    expect(searchFor(s)).toMatch(/^\?size=small&seed=[0-9a-z]+$/);
  });
});
