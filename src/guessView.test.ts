/** The guess view (#197): one run on stage, played in guess mode, beside Visualize and Race. */
import { describe, expect, it } from "vitest";
import { createAppStore, gameQuestionsOf, selectGameUnavailable, selectRaceRuns } from "@/appStore";
import { routeFor } from "@/navigation";
import { href, type Route } from "@/routes";
import { readLocation } from "@/urlState";

const storeAt = (route: Route) =>
  createAppStore({ url: readLocation(href(route), "?size=10"), isMobile: false, isPortrait: false, theme: "dark" });

const insertion: Route = { module: "sorting", page: "algorithm", algorithm: "insertion" };

describe("the guess view", () => {
  it("asks guess mode's questions only in the guess view", () => {
    const app = storeAt(insertion);
    expect(gameQuestionsOf(app.getState())).toEqual([]);
    app.getState().setView("guess");
    expect(gameQuestionsOf(app.getState()).length).toBeGreaterThan(0);
    app.getState().setView("race");
    expect(gameQuestionsOf(app.getState())).toEqual([]);
  });

  it("keeps the run and stops playback when switching from Visualize, on the algorithm's page", () => {
    const app = storeAt(insertion);
    const run = app.getState().sorting.run;
    app.getState().seek(3);
    app.getState().play();
    app.getState().setView("guess");
    const s = app.getState();
    expect(s.sorting.run).toBe(run);
    expect(s.frameIndex).toBe(3);
    expect(s.isPlaying).toBe(false);
    expect(selectRaceRuns(s)).toEqual([]);
    expect(href(routeFor(s))).toBe(href(insertion));
  });

  it("stays on when another algorithm is picked, and leaves for a module without guess mode", () => {
    const app = storeAt(insertion);
    app.getState().setView("guess");
    app.getState().pick("sorting", "bubble");
    expect(app.getState().view).toBe("guess");
    app.getState().pick("fourier", "square");
    expect(app.getState().view).toBe("single");
  });

  it("keeps the score across views until it's reset", () => {
    const app = storeAt(insertion);
    app.getState().setView("guess");
    app.setState({ gameScore: { asked: 5, right: 3, streak: 1, best: 2 } });
    app.getState().setView("race");
    app.getState().setView("single");
    app.getState().setView("guess");
    expect(app.getState().gameScore).toMatchObject({ asked: 5, right: 3 });
    app.getState().resetGame();
    expect(app.getState().gameScore).toMatchObject({ asked: 0, right: 0 });
  });

  it("doesn't play a run guess mode can't play, and Visualize still does", () => {
    const app = storeAt(insertion);
    app.getState().actions.sorting.setSize(40);
    app.getState().setView("guess");
    expect(selectGameUnavailable(app.getState())).not.toBeNull();
    app.getState().play();
    expect(app.getState().isPlaying).toBe(false);
    app.getState().setView("single");
    app.getState().play();
    expect(app.getState().isPlaying).toBe(true);
  });
});
