import { MUD_COST } from "@/pathfinding";
import type { Theme } from "@/store";
import { Swatch } from "@/components/TourSwatch";
import type { TourStep } from "./types";

// The guided tour of each module: which control to light up, and what to say about it.

const colorNames: Record<Theme, { comparing: string; done: string }> = {
  dark: { comparing: "Purple", done: "green" },
  light: { comparing: "Orange", done: "teal" },
};

export const sortingTour: TourStep[] = [
  {
    anchor: "picker",
    title: "Pick an algorithm",
    text: () => "Nine of them, grouped by how well they cope with bigger arrays.",
  },
  {
    anchor: "bars",
    title: "The array",
    text: ({ theme }) => (
      <>
        Each bar is a number. <Swatch className="bg-secondary" />
        {colorNames[theme].comparing} bars are being compared; <Swatch className="bg-primary" />
        {colorNames[theme].done} ones are already in their final place.
      </>
    ),
  },
  {
    anchor: "play",
    title: "Play it",
    text: ({ wide }) =>
      `Watch it sort, or go one step at a time with the buttons on either side.${wide ? " On a keyboard: Space, ← and →." : ""}`,
  },
  {
    anchor: "narration",
    title: "Follow each step",
    text: ({ wide }) =>
      wide
        ? "The code it's running, with the current line lit up, and what just happened in plain words."
        : "What just happened, in plain words. Tap it to see the code.",
  },
  {
    anchor: "speed",
    title: "Set the pace",
    text: () => "1× is tuned to the size of the array. Go slower to read along, or faster to see the big picture.",
  },
  {
    anchor: "settings",
    title: "Change the array",
    text: () => "How many items, how they start out (random, reversed, nearly sorted…), and bars or numbers.",
  },
  {
    anchor: "race",
    title: "Race them",
    text: () => "Run up to four algorithms on the same array, side by side, and see which one does the least work.",
  },
];

export const pathfindingTour: TourStep[] = [
  {
    anchor: "picker",
    title: "Pick a search",
    text: () => "Five ways to get from start to target. Some find the shortest path, some just find one.",
  },
  {
    anchor: "bars",
    title: "The grid",
    text: () => (
      <>
        Get from the <Swatch className="bg-primary" />
        start to the <Swatch className="ml-1 bg-background ring-2 ring-foreground" />
        target. Drag across the grid to draw walls, and drag either one to move it.
      </>
    ),
  },
  {
    anchor: "tools",
    phoneAnchor: "settings",
    title: "Walls, mud and layouts",
    text: ({ phone }) =>
      `${phone ? "In settings: switch" : "Switch"} the brush to mud: it can be crossed, but each step on it costs ${MUD_COST}. Or start from a maze, random walls or rough terrain.`,
  },
  {
    anchor: "play",
    title: "Play it",
    text: ({ wide }) =>
      `Watch the search spread, or go one step at a time with the buttons on either side.${wide ? " On a keyboard: Space, ← and →." : ""}`,
  },
  {
    anchor: "narration",
    title: "Follow the search",
    text: ({ theme, wide }) => (
      <>
        <Swatch className="bg-secondary" />
        {colorNames[theme].comparing} cells are waiting to be explored, faded ones are done, and the{" "}
        <Swatch className="bg-primary" />
        {colorNames[theme].done} line is the path.{" "}
        {wide ? "Here: the code it's running and what just happened." : "Tap here to see the code it's running."}
      </>
    ),
  },
  {
    anchor: "settings",
    title: "Change the grid",
    text: () => "A smaller grid to read along, or a bigger one to see how each search spreads.",
  },
];
