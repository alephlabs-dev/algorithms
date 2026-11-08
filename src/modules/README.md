# Modules

Each module (sorting, pathfinding, …) is one visualizer. The shared interface — top bar, dock, code card,
pickers, tour, settings — never asks which module is on stage; it asks the module.

A module is two declarations:

- **Slice** (`<id>.slice.ts`, typed by `ModuleSlice` in `slice.ts`, no React, no `window`): the module's state
  and how it changes, all as pure functions over its own state. Its input and settings from the link, the
  algorithm on stage, its actions, "New", its race runs for a view, an input that fits the screen, its tour
  key, and its engine: how long a run is, how its steps are paced, which page it's on and the query string
  that reproduces the run. The store holds the slice under the module's id (`s.pathfinding.grid`) and binds
  its actions (`s.actions.pathfinding.editGrid(grid)`); only the store writes.
- **Interface** (`<id>.tsx`, typed by `ModuleUI` in `types.ts`): its stage and race lanes, tools, legend, dock
  counters, settings, algorithms and racers, texts, pseudocode and narration, and tour.

What the store does once, for every module: picking an algorithm (`pick`) enters the module in single view,
switching the view builds the race runs of the module on stage and drops everyone else's (`forView`), any
action that replaces the run starts playback over, and a screen change replaces only the inputs that no longer
fit (`fit`). See `docs/adr/0002-one-nested-slice-per-module.md`.

## Adding one

1. **Slice:** the algorithms as step generators recorded into a timeline (see `src/algorithms` and
   `src/pathfinding`), then `src/modules/<id>.slice.ts` with `defineModule`, registered in `slices`
   (`engine.ts`). That one entry gives the store the module's state, actions and engine.
2. **Interface:** `src/modules/<id>.tsx` filling in `ModuleUI`, registered in `moduleUIs` (`index.ts`),
   and its tour in `tours.tsx`.
3. **Pages:** its routes in `src/routes.ts` (a module page, one per algorithm, a race), reading them in
   `src/urlState.ts` and switching to them in `applyRoute` (`src/navigation.ts`).
4. **Search engines:** titles and descriptions in `src/seo/pages.ts`, articles in `src/components/About.tsx`.
5. **Landing page:** give it a `route` and a `count` in `src/consts/modules.ts`, and a thumbnail in
   `src/components/Landing/Thumbnails.tsx`.

6. **Guess mode** (optional): give the slice's engine a `game` that lists the run's questions (see `src/game`).
   Each one names the frame it's asked before, so playback stops there; the stage can draw what the
   question needs (spots to tap, a cell marked "?") from `selectGameQuestion`.

Each slice has its own test (`<id>.slice.test.ts`), run without a browser. `engine.test.ts` checks that every
page an engine can be on belongs to it and survives its own URL, and `src/switching.test.ts` pins what switching
algorithm, module or view looks like.
