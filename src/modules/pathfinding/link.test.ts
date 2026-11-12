import { describe, expect, it } from "vitest";
import { engines } from "@/modules/engine";
import { EXAMPLE_SPEED, defaultsOf, openLink, reopened, stateFor, within } from "@/modules/testing";
import { routePath } from "@/routes";
import { readLocation } from "@/urlState";
import { seededRandom } from "@/utils/random";
import { applyPreset, emptyGrid, encodeCells } from "./grid";
import { pathfindingLink } from "./link";
import { pathfindingManifest } from "./manifest";
import type { PathAlgorithm } from "./types";

describe("pathfinding's link", () => {
  it("opens its example link with every setting the link carries", () => {
    const maze = applyPreset(emptyGrid(17, 33), "maze", seededRandom(3));
    expect(pathfindingManifest.example.search).toBe(
      pathfindingLink.write(
        { gridSize: "medium", cells: encodeCells(maze.cells), start: maze.start, end: maze.end, racers: ["bfs", "astar"] },
        EXAMPLE_SPEED,
      ),
    );
    expect(stateFor("pathfinding", "single", false).pathfinding).toMatchObject({
      algorithm: "dijkstra",
      gridSize: "medium",
      grid: maze,
      racers: ["bfs", "astar"],
    });
  });

  it("puts every setting it shares in its link, so editing it changes the link", () => {
    const changes = [
      within("pathfinding", { grid: applyPreset(emptyGrid(17, 33), "walls", seededRandom(8)) }),
      within("pathfinding", { racers: ["dfs", "greedy"] }),
    ];
    for (const change of changes) {
      const state = stateFor("pathfinding", "single", false);
      expect(engines.pathfinding.search(change(state))).not.toBe(engines.pathfinding.search(state));
    }
  });

  describe("url state", () => {
    it("round-trips a pathfinding grid", () => {
      const grid = {
        gridSize: "medium" as const,
        cells: "AbC-_9",
        start: 400,
        end: 12,
        racers: ["bfs", "astar", "greedy"] as PathAlgorithm[],
      };
      const query = pathfindingLink.write(grid, "1x");
      expect(readLocation(routePath({ module: "pathfinding", page: "algorithm", algorithm: "astar" }), query)).toMatchObject({
        module: "pathfinding",
        view: "single",
        link: { algorithm: "astar", params: grid },
      });
      expect(readLocation(routePath({ module: "pathfinding", page: "race" }), query)).toMatchObject({
        module: "pathfinding",
        view: "race",
        link: { params: grid },
      });
    });

    it("keeps pathfinding racers valid and in order", () => {
      const at = (race: string) => (readLocation("/pathfinding/race", `?race=${race}`).link.params as { racers?: string[] }).racers;
      expect(at("greedy,bfs,greedy")).toEqual(["bfs", "greedy"]);
      expect(at("astar")).toBeUndefined();
      expect(at("quick,merge")).toBeUndefined();
    });
  });
});

describe("pathfinding's captured links", () => {
  // Full links as the app wrote them before the link codecs moved into the modules (#128), opened on a
  // phone held upright: old shared links keep opening the same run.
  const links: [path: string, query: string][] = [
    ["/pathfinding/a-star", "?grid=small&cells=VVVVBAAUERUFREAVEVVERBQVEQUAQBVVUQAEFFFRRQBAVVUV&from=1v&to=23&race=bfs%2Castar%2Cgreedy&speed=2x"],
    ["/pathfinding/race", "?grid=small&cells=VVVVBAAUERUFREAVEVVERBQVEQUAQBVVUQAEFFFRRQBAVVUV&from=1v&to=23&race=bfs%2Castar%2Cgreedy&speed=2x"],
  ];

  it("round-trips a full link of every page kind it writes", () => {
    for (const [path, query] of links) expect(reopened(path, query), path + query).toBe(query);
  });

  it("falls back to the defaults on values it doesn't have", () => {
    const s = openLink("/pathfinding/a-star", "?grid=huge&cells=***&from=-1&to=zz&race=bfs");
    const d = defaultsOf("/pathfinding/a-star");
    expect(s.pathfinding).toMatchObject({ gridSize: d.pathfinding.gridSize, racers: d.pathfinding.racers });
  });

  it("keeps racers unique and in order, and rejects too few or too many", () => {
    const racers = (race: string) => openLink("/pathfinding/race", `?race=${race}`).pathfinding.racers;
    const d = defaultsOf("/pathfinding/race").pathfinding.racers;
    expect(racers("greedy,bfs,greedy")).toEqual(["bfs", "greedy"]);
    expect(racers("astar")).toEqual(d);
    expect(racers("bfs,dfs,dijkstra,astar,greedy")).toEqual(d);
    expect(racers("quick,merge")).toEqual(d);
  });
});
