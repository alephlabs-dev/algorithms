# One folder per module, registered as a manifest, a slice and an interface

Adding Mazes (#152) touched 38 files, 24 of them only to register module-owned content in shared places (tour, articles, SEO text, hints, landing entry and thumbnail, settings, pace, sentence runs) and in hand-kept test lists that fail silently when a module is missing (#163). Now everything a module owns lives in `src/modules/<id>/`: its slice, link, interface, domain code, constants, components, canvas paint, content and unit tests. It reaches the rest of the app through three pieces, each with one entry in its registry: `manifest.ts` (pages and slugs, SEO titles and descriptions, landing entry, "About …" hints, whether it's translated, example links), `slice.ts` (state, actions and engine, including its pace in seconds and its sentence runs) and `ui.tsx` (stage, tour, articles, thumbnail, settings). `ModuleId` and the order modules appear in come from the manifest registry; `slices` and `moduleUIs` are `Record<ModuleId, …>`, so the typecheck demands the other two entries. Shared tests and e2e specs derive their routes, pages and tour keys from the registries instead of keeping lists.

The manifest is a separate piece because e2e and the prerender plugin run in Node and can't import React: the manifest may import only Node-safe code (its own types, `@/i18n`, `@/routes`), which a lint rule enforces, so `tsconfig.node.json` includes `src/modules/*/manifest.ts` by glob instead of listing files by hand. Amended in #187: search-engine text, hints and landing counts need each algorithm's names and descriptions, so the manifest may also import its own `algorithms.ts`, which the same rule keeps Node-safe (its own types, `@/i18n`, `@/routes`, and types only from elsewhere) and the same glob includes. Moving those texts into the manifest instead would have split each algorithm's text across two files. Two more lint rules keep the folders honest: a module can't import from another module's folder, and shared code reaches a module only through the registries. These replace the canvas paint rule from #181, since each paint file now lives in its module.

## Considered options

- **One registry holding everything, React included**: one line per module, but Node (e2e, prerender) couldn't import it.
- **Project references** (`tsconfig.node.json` referencing `tsconfig.app.json`): no glob convention, but the app project would have to be `composite` and emit declarations, adding a build step Vite doesn't need.
- **`import.meta.glob` to discover modules**: zero registration lines, but it's Vite-only, so Playwright and plain `tsc` can't follow it, and the order of modules would come from file names.

## Consequences

- Module-specific e2e specs stay in `e2e/` (one Playwright `testDir`); unit tests move next to the module.
- Every new module is covered by every shared e2e spec automatically, so CI time grows with each module.
