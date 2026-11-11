import { describe, expect, it } from "vitest";
import { engines } from "@/modules/engine";
import { EXAMPLE_SPEED, stateFor, within } from "@/modules/testing";
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
