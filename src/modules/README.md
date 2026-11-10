# Modules

Each module (sorting, pathfinding, …) is one visualizer. The shared interface — top bar, dock, code card,
pickers, tour, settings — never asks which module is on stage; it asks the module.

A module is three declarations. The first is its **manifest** (`<id>/manifest.ts`, typed by `ModuleManifest`
in `src/routes.ts`), what the rest of the app and Node (prerender, e2e) know about it without React: its pages
and slugs, what search engines and the "About …" hint say on each, its landing card, whether it's translated,
and an example link with settings that differ from its defaults. The registry `manifests.ts` gives the module
ids (`ModuleId`) and their order (landing, menu, sitemap). The other two:

- **Slice** (`<id>/slice.ts`, typed by `ModuleSlice` in `slice.ts`, no React, no `window`): the module's state
  and how it changes, all as pure functions over its own state. Its input and settings from the link, the
  algorithm on stage, its actions, "New", its race runs for a view, an input that fits the screen, its tour
  key, its step sentence runs (`sentences`, for `e2e/step-sentences-fit.spec.ts`), and its engine: how long a
  run is, how its steps are paced (its pace: the most seconds a run takes at 1×), which page it's on and the
  query string that reproduces the run. The store holds the slice under the module's id (`s.pathfinding.grid`) and binds
  its actions (`s.actions.pathfinding.editGrid(grid)`); only the store writes.
- **Interface** (`<id>/ui.tsx`, typed by `ModuleUI` in `types.ts`): its stage and race lanes, tools, legend, dock
  counters, settings, algorithms and racers, texts, pseudocode and narration, and tour.

What the store does once, for every module: picking an algorithm (`pick`) enters the module in single view,
switching the view builds the race runs of the module on stage and drops everyone else's (`forView`), any
action that replaces the run starts playback over, and a screen change replaces only the inputs that no longer
fit (`fit`). See `docs/adr/0002-one-nested-slice-per-module.md`.

## One folder per module

Everything a module owns lives in `src/modules/<id>/` (`docs/adr/0003-one-folder-per-module-three-registries.md`).
Mazes was the first one (#186); the others followed it (#189). A module's folder, as Mazes has it:

| File | What it holds |
| --- | --- |
| `slice.ts`, `slice.test.ts` | The slice, registered in `slices` (`engine.ts`), and its test |
| `link.ts` | How its part of the link reads and writes (`LinkCodec`) |
| `ui.tsx` | The interface, registered in `moduleUIs` (`index.ts`) |
| `manifest.ts` | Pages, search-engine text, landing entry, hints, example link; registered in `manifests` (`manifests.ts`) |
| `sentences.ts` | Its step sentence runs, the slice's `sentences` |
| `link.test.ts` | Its example link opens with every setting, and its pages and params read back |
| `types.ts` | Its domain types and constants; no imports, so Node can read it |
| `generators.ts`, `run.ts` | Domain code: the algorithms and the run that records their steps |
| `algorithms.ts` | Each algorithm's names and texts, and other module constants |
| `narrate.ts` | The step sentences |
| `paint.ts`, `paint.test.ts` | How it looks on a shared canvas renderer (`src/canvas/`) |
| `MazeStage.tsx`, `MazeTools.tsx`, … | Its components |

Other modules add what they need beside these: their own canvas renderer when no shared one fits
(`barsRenderer.ts`, `treeRenderer.ts`, …), and their Guess-mode questions in `questions.ts` and `questions.test.ts`.

Shared helpers stay shared: the grid renderer, the theme and the other canvas helpers in `src/canvas/`, UI parts in
`src/components/`, Guess mode's question types and helpers in `src/game/`, utilities in `src/utils/`.
Module-specific e2e specs stay in `e2e/`.

Three rules, enforced by the lint (`house/module-boundaries` in `eslint/house.js`):

- A module imports from its own folder and from shared code, never from another module's folder. What two
  modules need goes to shared code.
- Shared code (e2e included) reaches a module only through the registries: `manifests.ts` imports its
  `manifest`, `engine.ts` its `slice`, `index.ts` its `ui`. Nothing else imports from a module folder.
- `manifest.ts` runs in Node (e2e, prerender), so it imports only its own `types.ts` and `algorithms.ts`,
  `src/i18n.ts` and `src/routes.ts`. Its `algorithms.ts` runs there too: the same imports, plus types from its own
  folder or shared code. `tsconfig.node.json` finds every module folder's `manifest.ts`, `types.ts` and
  `algorithms.ts` by glob.

An import that breaks a rule and can't be fixed yet gets a per-line `eslint-disable-next-line` with a TODO naming
the ticket that removes it. The rule itself is never turned off.

## Adding one

1. **Manifest:** `src/modules/<id>/manifest.ts` with its pages, search-engine text, hints, landing card,
   `translated` and an example link, registered in `manifests` (`manifests.ts`). That entry gives the module
   its id, its place in the order, its pages (`src/routes.ts`) and its prerendered pages and sitemap entries.
2. **Slice:** the algorithms as step generators recorded into a timeline, then `src/modules/<id>/slice.ts`
   with `defineModule`, registered in `slices` (`engine.ts`). That one entry gives the store the module's
   state, actions and engine; its pace and its step sentence runs (`sentences.ts`) are part of it.
3. **Interface:** `src/modules/<id>/ui.tsx` filling in `ModuleUI`, registered in `moduleUIs` (`index.ts`),
   and its tour in `tours.tsx`.
4. **Articles** in `src/components/About.tsx`, and a landing thumbnail in `src/components/Landing/Thumbnails.tsx`.
   The typecheck flags most of these.
5. **Shared tests:** its `link.test.ts` (the example link opens with every setting it carries), a link per page
   kind in `links.test.ts` (`ROUND_TRIPS`), and its pages and tour key in `e2e/settings-fit.spec.ts`,
   `e2e/tap-targets.spec.ts` and `e2e/step-sentences-fit.spec.ts` (and `e2e/algorithm-picker.spec.ts` once it has
   two algorithms or more).

6. **Guess mode** (optional): give the slice's engine a `game` that lists the run's questions (see `src/game`).
   Each one names the frame it's asked before, so playback stops there; the stage can draw what the
   question needs (spots to tap, a cell marked "?") from `selectGameQuestion`.

Each slice has its own test (`<id>/slice.test.ts`), run without a browser. `engine.test.ts` checks that every
page an engine can be on belongs to it and survives its own URL, and `src/switching.test.ts` pins what switching
algorithm, module or view looks like.
