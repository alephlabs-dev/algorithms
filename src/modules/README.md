# Modules

Each module (sorting, pathfinding, …) is one visualizer. The shared interface — top bar, dock, code card,
pickers, tour, settings — never asks which module is on stage; it asks the module.

A module is two declarations:

- **Engine** (`engine.ts`, no React): how long a run is, how its steps are paced, which page the store is on
  and the query string that reproduces the run. The store and the playback loop read it.
- **Interface** (`<id>.tsx`, typed by `ModuleUI` in `types.ts`): its stage and race lanes, tools, legend, dock
  counters, settings, algorithms and racers, texts, pseudocode and narration, and tour.

## Adding one

1. **Engine:** the algorithms as step generators recorded into a timeline (see `src/algorithms` and
   `src/pathfinding`), the module's state and actions in `src/store.ts`, and its entry in `engines`.
2. **Interface:** `src/modules/<id>.tsx` filling in `ModuleUI`, registered in `moduleUIs` (`index.ts`),
   and its tour in `tours.tsx`.
3. **Pages:** its routes in `src/routes.ts` (a module page, one per algorithm, a race), reading them in
   `src/urlState.ts` and switching to them in `navigate` (`src/urlSync.ts`).
4. **Search engines:** titles and descriptions in `src/seo/pages.ts`, articles in `src/components/About.tsx`.
5. **Landing page:** give it a `route` and a `count` in `src/consts/modules.ts`, and a thumbnail in
   `src/components/Landing/Thumbnails.tsx`.

`engine.test.ts` checks that every page an engine can be on belongs to it and survives its own URL.
